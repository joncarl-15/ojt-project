import nodemailer from "nodemailer";
import { UserRepository } from "../repositories/userRepository";
import { MessageRepository } from "../repositories/messageRepository";
import { AnnouncementModel } from "../models/announcementModel";
import { MessageModel } from "../models/messageModel";
import { UserModel } from "../models/userModel";

export class EmailService {
  private transporter: nodemailer.Transporter;
  private userRepository: UserRepository;
  private messageRepository: MessageRepository;

  private isConfigured: boolean = false;

  constructor() {
    this.userRepository = new UserRepository();
    this.messageRepository = new MessageRepository();

    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      this.isConfigured = true;
    } else {
      // Initialize with a dummy transporter or null, handled by isConfigured check
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
      console.warn("Email credentials not found in environment variables. Email notifications will be disabled.");
    }
  }

  /**
   * Send announcement notification email to students in the same program as coordinator
   * @param announcement - Announcement data
   * @param coordinatorId - ID of the coordinator creating the announcement
   */
  async sendAnnouncementNotificationToStudents(
    announcement: AnnouncementModel,
    coordinatorId: string
  ): Promise<void> {
    if (!this.isConfigured) return;

    try {
      // Get coordinator data to determine their program
      const coordinator = await this.userRepository.getUser(coordinatorId);
      if (!coordinator) {
        console.log("Coordinator not found");
        return;
      }

      // Get students from the same program as the coordinator
      const students = (await this.userRepository.searchUser(
        {
          role: "student",
          program: coordinator.program,
        },
        { multiple: true, populate: false }
      )) as UserModel[];

      const emailRecipients = students
        .filter((student) => student.email)
        .map((student) => student.email);

      if (emailRecipients.length === 0) {
        console.log(`No students with email addresses found in ${coordinator.program} program`);
        return;
      }

      // Prepare email content
      const emailSubject = `New Announcement: ${announcement.title}`;
      const emailBody = this.generateAnnouncementEmailHTML(announcement, coordinator);

      // Send email to all recipients
      const mailOptions = {
        from: process.env.EMAIL_USER,
        bcc: emailRecipients, // Using BCC to hide recipient list
        subject: emailSubject,
        html: emailBody,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(
        `Announcement notification sent to ${emailRecipients.length} ${coordinator.program} students`
      );
    } catch (error: any) {
      console.error("Failed to send announcement notification emails:", error);
      // Don't throw error to avoid breaking the announcement creation process
    }
  }

  /**
   * Send message notification email to the recipient
   * @param message - Message data (populated with sender and receiver)
   */
  async sendMessageNotificationToRecipient(message: MessageModel): Promise<void> {
    if (!this.isConfigured) return;

    try {
      // Get populated message data
      const populatedMessage = await this.messageRepository.getMessage(message._id);
      if (!populatedMessage || !populatedMessage.receiver || !populatedMessage.sender) {
        console.log("Message data incomplete for email notification");
        return;
      }

      const sender = populatedMessage.sender as any as UserModel;
      const receiver = populatedMessage.receiver as any as UserModel;

      // Only send email if sender is coordinator and receiver is student from same program
      if (sender.role !== "coordinator" || receiver.role !== "student") {
        return; // Don't send email for non-coordinator to student messages
      }

      // Check if both users are from the same program
      if (sender.program !== receiver.program) {
        console.log("Sender and receiver are from different programs, not sending email");
        return;
      }

      if (!receiver.email) {
        console.log("Receiver has no email address");
        return;
      }

      // Prepare email content
      const emailSubject = `New Message from ${sender.firstName} ${sender.lastName}`;
      const emailBody = this.generateMessageEmailHTML(populatedMessage, sender, receiver);

      // Send email to recipient
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: receiver.email,
        subject: emailSubject,
        html: emailBody,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Message notification sent to ${receiver.email}`);
    } catch (error: any) {
      console.error("Failed to send message notification email:", error);
      // Don't throw error to avoid breaking the message creation process
    }
  }

  /**
   * Generate HTML content for announcement notification email
   * @param announcement - Announcement data
   * @param coordinator - Coordinator who created the announcement
   */
  private generateAnnouncementEmailHTML(
    announcement: AnnouncementModel,
    coordinator: UserModel
  ): string {
    const formatDate = (date: Date | string | undefined) => {
      if (!date) return "N/A";
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
      <meta charset="utf-8">
      <title>New Announcement Notification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .announcement-details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .program-badge { 
          display: inline-block; 
          padding: 5px 10px; 
          border-radius: 3px; 
          color: white;
          font-size: 12px;
          text-transform: uppercase;
          background-color: #2196F3;
        }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
      </head>
      <body>
      <div class="container">
        <div class="header">
          <h1>📢 New Announcement</h1>
        </div>
        <div class="content">
          <h2>Hello ${coordinator.program?.toUpperCase()} Student!</h2>
          <p>Your coordinator has created a new announcement. Here are the details:</p>
          
          <div class="announcement-details">
            <h3>${announcement.title}</h3>
            <p><strong>📅 Created:</strong> ${formatDate((announcement as any).createdAt)}</p>
            <p><strong>👨‍💼 From:</strong> ${coordinator.firstName} ${coordinator.lastName}</p>
            <p><strong>🎓 Program:</strong> <span class="program-badge">${coordinator.program?.toUpperCase()}</span></p>
            <div style="margin-top: 15px; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #4CAF50;">
              <p><strong>📝 Content:</strong></p>
              <p>${announcement.content}</p>
            </div>
          </div>
          
          <p>Please make sure to check the announcement details and take any necessary action.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from the OJT Monitoring System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML content for message notification email
   * @param message - Message data
   * @param sender - User who sent the message
   * @param receiver - User who received the message
   */
  private generateMessageEmailHTML(
    message: MessageModel,
    sender: UserModel,
    receiver: UserModel
  ): string {
    const formatDate = (date: Date | string | undefined) => {
      if (!date) return "N/A";
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
      <meta charset="utf-8">
      <title>New Message Notification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .message-details { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .program-badge { 
          display: inline-block; 
          padding: 5px 10px; 
          border-radius: 3px; 
          color: white;
          font-size: 12px;
          text-transform: uppercase;
          background-color: #FF9800;
        }
        .message-content {
          background-color: #e3f2fd;
          padding: 15px;
          border-left: 4px solid #2196F3;
          margin: 15px 0;
        }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .action-button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 10px 0;
        }
      </style>
      </head>
      <body>
      <div class="container">
        <div class="header">
          <h1>💬 New Message</h1>
        </div>
        <div class="content">
          <h2>Hello ${receiver.firstName}!</h2>
          <p>You have received a new message from your coordinator:</p>
          
          <div class="message-details">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div>
                <p><strong>From:</strong> ${sender.firstName} ${sender.lastName}</p>
                <p><strong>Program:</strong> <span class="program-badge">${sender.program?.toUpperCase()}</span></p>
              </div>
              <div style="text-align: right;">
                <p><strong>📅 Sent:</strong> ${formatDate(message.sentAt)}</p>
              </div>
            </div>
            
            <div class="message-content">
              <p>${message.content}</p>
            </div>
          </div>
          
          <p>Please log in to your account to view and respond to this message.</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/messages" class="action-button">
              View Messages
            </a>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated message from the OJT Monitoring System.</p>
          <p>Please do not reply to this email. Use the system's messaging feature to respond.</p>
        </div>
      </div>
      </body>
      </html>
    `;
  }

  /**
   * Verify email configuration
   */
  async verifyEmailConfig(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error("Email configuration verification failed:", error);
      return false;
    }
  }
}
