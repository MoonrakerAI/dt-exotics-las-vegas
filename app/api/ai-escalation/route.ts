import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface EscalationRequest {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  originalQuestion: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp?: string;
  }>;
  escalationReason: string;
  urgency?: 'low' | 'medium' | 'high';
}

export async function POST(req: Request) {
  try {
    const body: EscalationRequest = await req.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      originalQuestion,
      conversationHistory,
      escalationReason,
      urgency = 'medium'
    } = body;

    if (!resend) {
      console.error('Resend API key not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      );
    }

    // Validate required fields
    if (!originalQuestion || !conversationHistory || conversationHistory.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: originalQuestion and conversationHistory' },
        { status: 400 }
      );
    }

    // Generate conversation summary
    const conversationSummary = generateConversationSummary(conversationHistory);
    
    // Format timestamp
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Determine urgency styling
    const urgencyColor = urgency === 'high' ? '#ef4444' : urgency === 'medium' ? '#f59e0b' : '#10b981';
    const urgencyText = urgency.charAt(0).toUpperCase() + urgency.slice(1);

    // Create email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AI Concierge Escalation - DT Exotics</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; text-align: center;">
              <h1 style="color: #00d4ff; margin: 0; font-size: 28px; font-weight: bold;">DT EXOTICS LAS VEGAS</h1>
              <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 16px;">AI Concierge Escalation</p>
            </div>

            <!-- Urgency Banner -->
            <div style="background-color: ${urgencyColor}; color: white; padding: 12px 30px; text-align: center;">
              <strong style="font-size: 14px;">🚨 ${urgencyText} Priority Escalation</strong>
            </div>

            <!-- Content -->
            <div style="padding: 30px;">
              
              <!-- Escalation Summary -->
              <div style="background-color: #f1f5f9; border-left: 4px solid #00d4ff; padding: 20px; margin-bottom: 25px;">
                <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 20px;">Customer Needs Human Assistance</h2>
                <p style="color: #475569; margin: 0; line-height: 1.6;">
                  The AI concierge was unable to fully address a customer inquiry and has escalated it for human review.
                </p>
              </div>

              <!-- Customer Information -->
              ${customerName || customerEmail || customerPhone ? `
              <div style="margin-bottom: 25px;">
                <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Customer Information</h3>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px;">
                  ${customerName ? `<p style="margin: 0 0 8px 0; color: #475569;"><strong>Name:</strong> ${customerName}</p>` : ''}
                  ${customerEmail ? `<p style="margin: 0 0 8px 0; color: #475569;"><strong>Email:</strong> <a href="mailto:${customerEmail}" style="color: #0ea5e9;">${customerEmail}</a></p>` : ''}
                  ${customerPhone ? `<p style="margin: 0 0 8px 0; color: #475569;"><strong>Phone:</strong> <a href="tel:${customerPhone}" style="color: #0ea5e9;">${customerPhone}</a></p>` : ''}
                  <p style="margin: 0; color: #475569;"><strong>Escalated:</strong> ${timestamp}</p>
                </div>
              </div>
              ` : ''}

              <!-- Original Question -->
              <div style="margin-bottom: 25px;">
                <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Original Question</h3>
                <div style="background-color: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px;">
                  <p style="margin: 0; color: #92400e; font-style: italic; line-height: 1.6;">"${originalQuestion}"</p>
                </div>
              </div>

              <!-- Escalation Reason -->
              <div style="margin-bottom: 25px;">
                <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Why This Was Escalated</h3>
                <div style="background-color: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 8px;">
                  <p style="margin: 0; color: #991b1b; line-height: 1.6;">${escalationReason}</p>
                </div>
              </div>

              <!-- Conversation Summary -->
              <div style="margin-bottom: 25px;">
                <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Conversation Summary</h3>
                <div style="background-color: #f0f9ff; border: 1px solid #7dd3fc; padding: 15px; border-radius: 8px;">
                  <p style="margin: 0 0 10px 0; color: #0c4a6e; font-weight: 600;">Key Points:</p>
                  <ul style="margin: 0; padding-left: 20px; color: #075985; line-height: 1.6;">
                    ${conversationSummary.keyPoints.map(point => `<li style="margin-bottom: 5px;">${point}</li>`).join('')}
                  </ul>
                </div>
              </div>

              <!-- Full Conversation -->
              <div style="margin-bottom: 25px;">
                <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Full Conversation History</h3>
                <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; max-height: 400px; overflow-y: auto;">
                  ${conversationHistory.map((msg, index) => `
                    <div style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; ${index === conversationHistory.length - 1 ? 'border-bottom: none;' : ''}">
                      <div style="display: flex; align-items: center; margin-bottom: 5px;">
                        <strong style="color: ${msg.role === 'user' ? '#059669' : '#7c3aed'}; font-size: 14px;">
                          ${msg.role === 'user' ? '👤 Customer' : '🤖 AI Concierge'}
                        </strong>
                        ${msg.timestamp ? `<span style="color: #6b7280; font-size: 12px; margin-left: 10px;">${new Date(msg.timestamp).toLocaleTimeString()}</span>` : ''}
                      </div>
                      <p style="margin: 0; color: #374151; line-height: 1.5; font-size: 14px;">${msg.content}</p>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Action Required -->
              <div style="background: linear-gradient(135deg, #00d4ff 0%, #0ea5e9 100%); color: white; padding: 20px; border-radius: 8px; text-align: center;">
                <h3 style="margin: 0 0 10px 0; font-size: 18px;">Action Required</h3>
                <p style="margin: 0 0 15px 0; line-height: 1.6;">
                  Please review this escalation and respond to the customer directly.
                </p>
                ${customerEmail ? `
                <a href="mailto:${customerEmail}?subject=Re: Your DT Exotics Inquiry&body=Hi ${customerName || 'there'},%0D%0A%0D%0AThank you for reaching out to DT Exotics Las Vegas. I'm following up on your recent inquiry..." 
                   style="display: inline-block; background-color: white; color: #0ea5e9; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
                  📧 Reply to Customer
                </a>
                ` : ''}
                ${customerPhone ? `
                <a href="tel:${customerPhone}" 
                   style="display: inline-block; background-color: rgba(255,255,255,0.2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; border: 2px solid white;">
                  📞 Call Customer
                </a>
                ` : ''}
              </div>

            </div>

            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                This escalation was automatically generated by the DT Exotics AI Concierge system.
              </p>
              <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 12px;">
                DT Exotics Las Vegas | (702) 518-0924 | contact@dtexoticslv.com
              </p>
            </div>

          </div>
        </body>
      </html>
    `;

    // Send escalation email to admin
    const emailResult = await resend.emails.send({
      from: 'DT Exotics AI Concierge <ai-escalation@dtexoticslv.com>',
      to: 'contact@dtexoticslv.com', // Admin email
      subject: `🚨 AI Escalation: Customer Needs Human Assistance - ${urgencyText} Priority`,
      html: emailHtml,
      replyTo: customerEmail || 'noreply@dtexoticslv.com'
    });

    if (emailResult.error) {
      console.error('Failed to send escalation email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send escalation email' },
        { status: 500 }
      );
    }

    console.log('AI escalation email sent successfully:', emailResult.data?.id);

    return NextResponse.json({
      success: true,
      message: 'Escalation email sent successfully',
      emailId: emailResult.data?.id
    });

  } catch (error) {
    console.error('Error in AI escalation:', error);
    return NextResponse.json(
      { error: 'Failed to process escalation request' },
      { status: 500 }
    );
  }
}

/**
 * Generate a summary of the conversation for the escalation email
 */
function generateConversationSummary(conversationHistory: Array<{role: string, content: string}>) {
  const keyPoints: string[] = [];
  
  // Extract user questions and concerns
  const userMessages = conversationHistory.filter(msg => msg.role === 'user');
  const aiMessages = conversationHistory.filter(msg => msg.role === 'assistant');
  
  // Add conversation stats
  keyPoints.push(`${userMessages.length} customer message(s) and ${aiMessages.length} AI response(s)`);
  
  // Identify key topics mentioned
  const topics = new Set<string>();
  const allContent = conversationHistory.map(msg => msg.content.toLowerCase()).join(' ');
  
  // Check for common topics
  if (allContent.includes('price') || allContent.includes('cost') || allContent.includes('rate')) {
    topics.add('pricing inquiries');
  }
  if (allContent.includes('available') || allContent.includes('book') || allContent.includes('reserve')) {
    topics.add('availability and booking');
  }
  if (allContent.includes('insurance') || allContent.includes('deposit') || allContent.includes('requirement')) {
    topics.add('rental requirements');
  }
  if (allContent.includes('delivery') || allContent.includes('pickup') || allContent.includes('location')) {
    topics.add('delivery and logistics');
  }
  if (allContent.includes('damage') || allContent.includes('accident') || allContent.includes('policy')) {
    topics.add('policies and procedures');
  }
  
  if (topics.size > 0) {
    keyPoints.push(`Topics discussed: ${Array.from(topics).join(', ')}`);
  }
  
  // Add the most recent user question
  const lastUserMessage = userMessages[userMessages.length - 1];
  if (lastUserMessage) {
    keyPoints.push(`Latest question: "${lastUserMessage.content.substring(0, 100)}${lastUserMessage.content.length > 100 ? '...' : ''}"`);
  }
  
  return { keyPoints };
}
