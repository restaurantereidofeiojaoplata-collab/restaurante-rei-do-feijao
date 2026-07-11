import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { SessionTokenService } from "../auth/session-token.service.js";

// Allowed origins are loaded from CORS_ORIGIN env var (comma-separated).
// Falls back to localhost for local development.
const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

@WebSocketGateway({
  cors: {
    origin: corsOrigins,
    credentials: true
  }
})
@Injectable()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    @Inject(SessionTokenService)
    private readonly sessionTokens: SessionTokenService
  ) {}

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const restaurantId = client.handshake.query.restaurantId as string;
    const token = client.handshake.query.token as string;

    if (!restaurantId || !token) {
      client.disconnect(true);
      this.logger.warn(`Client ${client.id} rejected: missing parameters (restaurantId or token)`);
      return;
    }

    try {
      const payload = this.sessionTokens.verify(token);

      // Reject if user's session is pending 2FA verification
      if (payload.permissions.includes("2fa:pending")) {
        client.disconnect(true);
        this.logger.warn(`Client ${client.id} rejected: 2FA verification pending`);
        return;
      }

      // Verify if restaurantId in JWT payload matches client query restaurantId
      if (payload.restaurantId !== restaurantId) {
        client.disconnect(true);
        this.logger.warn(`Client ${client.id} rejected: restaurantId mismatch (${payload.restaurantId} vs ${restaurantId})`);
        return;
      }

      void client.join(restaurantId);
      this.logger.log(`Client ${client.id} joined restaurant room: ${restaurantId}`);
    } catch (err) {
      client.disconnect(true);
      this.logger.warn(`Client ${client.id} rejected: invalid session token`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  broadcastToRestaurant(restaurantId: string, event: string, payload: unknown) {
    if (this.server) {
      this.server.to(restaurantId).emit(event, payload);
    }
  }
}
