import { Injectable, Logger } from "@nestjs/common";
import nodemailer from "nodemailer";

export type SendWelcomeMailInput = {
  toEmail: string;
  adminName: string;
  restaurantName: string;
  restaurantSlug: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromEmail: string;

  constructor() {
    const smtpHost = process.env.SMTP_HOST || "smtp.resend.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
    const smtpUser = process.env.SMTP_USER || "resend";
    const smtpPass = process.env.SMTP_PASS || process.env.RESEND_API_KEY || "";
    this.fromEmail = process.env.SMTP_FROM || "GourmetOS <onboarding@resend.dev>";

    // Only configure nodemailer if credentials are provided
    if (smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log(`SMTP Mailer initialized using host: ${smtpHost}:${smtpPort}`);
    } else {
      this.logger.warn(
        "No SMTP_PASS or RESEND_API_KEY detected. MailService will run in CONSOLE FALLBACK mode."
      );
    }
  }

  async sendWelcomeMail(input: SendWelcomeMailInput): Promise<boolean> {
    const frontendUrl = process.env.NEXT_PUBLIC_API_BASE_URL
      ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(":3333", ":3000")
      : "http://localhost:3000";

    const loginUrl = `${frontendUrl}`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao GourmetOS</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f9fafb;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    .header {
      background-color: #10b981;
      padding: 40px;
      text-align: center;
      color: #ffffff;
    }
    .header-logo {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.05em;
      margin: 0;
    }
    .header-logo span {
      color: #047857;
    }
    .content {
      padding: 40px;
      color: #374151;
    }
    h1 {
      font-size: 22px;
      font-weight: 800;
      color: #111827;
      margin-top: 0;
      margin-bottom: 16px;
      letter-spacing: -0.02em;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      margin-top: 0;
      margin-bottom: 24px;
    }
    .card {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .card-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #15803d;
      margin-top: 0;
      margin-bottom: 12px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .info-label {
      font-weight: 600;
      color: #4b5563;
    }
    .info-value {
      font-weight: 700;
      color: #111827;
    }
    .button-container {
      text-align: center;
      margin: 32px 0 16px 0;
    }
    .btn {
      display: inline-block;
      background-color: #10b981;
      color: #000000 !important;
      text-decoration: none;
      font-size: 13px;
      font-weight: 800;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
      transition: all 0.2s ease;
    }
    .footer {
      padding: 0 40px 40px 40px;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-logo">Gourmet<span>OS</span></div>
      </div>
      <div class="content">
        <h1>Olá, ${input.adminName}!</h1>
        <p>Parabéns! O seu restaurante <strong>${input.restaurantName}</strong> foi cadastrado com sucesso no GourmetOS. A partir de agora, toda a gestão de comanda, KDS e caixas está unificada em um só painel.</p>
        
        <div class="card">
          <div class="card-title">Dados de Acesso</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px;">
            <tr>
              <td style="padding: 4px 0; font-weight: 600; color: #4b5563;">Restaurante:</td>
              <td style="padding: 4px 0; font-weight: 700; color: #111827; text-align: right;">${input.restaurantName}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: 600; color: #4b5563;">Slug do Restaurante:</td>
              <td style="padding: 4px 0; font-weight: 700; color: #10b981; text-align: right;">${input.restaurantSlug}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: 600; color: #4b5563;">E-mail do Administrador:</td>
              <td style="padding: 4px 0; font-weight: 700; color: #111827; text-align: right;">${input.toEmail}</td>
            </tr>
          </table>
        </div>

        <p>Para começar a operar o sistema, clique no botão abaixo para ir direto à tela de login do seu painel e utilize os dados cadastrados.</p>
        
        <div class="button-container">
          <a href="${loginUrl}" class="btn">Acessar Meu Painel</a>
        </div>
      </div>
      <div class="footer">
        Este é um e-mail automático enviado pelo sistema GourmetOS.<br>
        Não responda a este e-mail.
      </div>
    </div>
  </div>
</body>
</html>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromEmail,
          to: input.toEmail,
          subject: "Bem-vindo ao GourmetOS! - Cadastro Concluído",
          html: htmlBody,
        });
        this.logger.log(`Onboarding email successfully sent to ${input.toEmail}`);
        return true;
      } catch (error) {
        this.logger.error(`Failed to send onboarding email to ${input.toEmail}:`, error);
        return false;
      }
    } else {
      // Console logging mode fallback
      this.logger.log(`
========================================================================
[CONSOLE MAIL FALLBACK] EMAIL SIMULADO COM SUCESSO!
Para: ${input.toEmail}
Assunto: Bem-vindo ao GourmetOS! - Cadastro Concluído
De: ${this.fromEmail}
Restaurante: ${input.restaurantName} (Slug: ${input.restaurantSlug})
Administrador: ${input.adminName}
URL de Acesso: ${loginUrl}
========================================================================
      `);
      return true;
    }
  }

  async sendSecurityAlertMail(toEmail: string, subject: string, text: string): Promise<boolean> {
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromEmail,
          to: toEmail,
          subject: subject,
          text: text,
        });
        this.logger.log(`Security alert email successfully sent to ${toEmail}`);
        return true;
      } catch (error) {
        this.logger.error(`Failed to send security alert email to ${toEmail}:`, error);
        return false;
      }
    } else {
      this.logger.log(`
========================================================================
[CONSOLE MAIL FALLBACK] ALERTA DE SEGURANÇA SIMULADO COM SUCESSO!
Para: ${toEmail}
Assunto: ${subject}
Conteúdo:
${text}
========================================================================
      `);
      return true;
    }
  }
}
