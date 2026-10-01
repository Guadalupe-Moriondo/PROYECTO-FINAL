import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Order } from '../orders/entities/order.entity';


@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: false, 
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  private async send(recipient: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('MAIL_FROM'),
        to: recipient,
        subject: subject,
        html,
      });
      this.logger.log(`Email sent to ${recipient}: ${subject}`);
    } catch (error) {
      this.logger.error(`Error sending email to ${recipient}`, error);
    }
  }

  async notifyNewOrder(order: Order) {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    if (!adminEmail) {
      this.logger.warn('ADMIN_EMAIL not configured, notification not sent');
      return;
    }

    const paymentMethodLabels: Record<string, string> = {
      cash: 'Efectivo',
      transfer: 'Transferencia',
      card: 'Tarjeta',
    };

    const paymentMethodLabel =
      paymentMethodLabels[order.paymentMethod] ?? order.paymentMethod;
    
    const detailRows = order.details
      .map(
        (d) => `
        <tr>
          <td style="padding:6px;border:1px solid #ddd;">${d.product.name}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center;">${d.quantity}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:right;">$${d.unitPrice}</td>
        </tr>`,
      )
      .join('');
 
    const html = `
      <h2>Nuevo pedido recibido</h2>
      <p><strong>Número de pedido:</strong> ${order.orderNumber}</p>
      <p><strong>Cliente:</strong> ${order.user.name} (${order.user.email})</p>
      <p><strong>Método de pago:</strong> ${paymentMethodLabel}</p>
      <table style="border-collapse:collapse;width:100%;">
        <thead>
          <tr>
            <th style="padding:6px;border:1px solid #ddd;">Producto</th>
            <th style="padding:6px;border:1px solid #ddd;">Cantidad</th>
            <th style="padding:6px;border:1px solid #ddd;">Precio unitario</th>
          </tr>
        </thead>
        <tbody>${detailRows}</tbody>
      </table>
      <p><strong>Total: $${order.total}</strong></p>
      <p>Ingresá al panel de administración para gestionar este pedido.</p>
    `;
 
    await this.send(adminEmail, `Nuevo pedido ${order.orderNumber}`, html);
  }

  
  async notifyStatusChange(order: Order) {
    const statusLabels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      in_preparation: 'En preparación',
      withdraw: 'Listo para retirar',
      delivered: 'Entregado',
    };

    const statusLabel = statusLabels[order.status] ?? order.status;

    const html = `
      <h2>Actualización de tu pedido</h2>
      <p>Tu pedido <strong>${order.orderNumber}</strong> ahora está:
        <strong>${statusLabel}</strong>
      </p>
    `;
    await this.send(order.user.email, `Actualización de pedido ${order.orderNumber}`, html);
  } 
}
