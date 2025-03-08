# Email Forwarding Service for @gauntletai.com

## Project Goal
Create an email forwarding service to maintain our @gauntletai.com email addresses.

## AWS Configuration

### AWS SES (Simple Email Service)
- **Region**: us-west-2
- **Email Receiving**: Uses `tigerpanda_ses_ruleset`
  - **Receipt Rule**: 
    - **Condition**: If email comes into tigerpanda.tv
    - **Actions**:
      1. Deliver to S3 bucket: `tigerpandatv-mail`
      2. Invoke Lambda: `tigerpandatv_email_forward`

### DNS Configuration (Route53)
To route emails to SES, configure domain with these DNS records:
- **Hosted Zone**: tigerpanda.tv
- **Required Records**:
  - `mail.tigerpanda.tv` **MX** record → `10 feedback-smtp.us-west-2.amazonses.com`
  - `mail.tigerpanda.tv` **TXT** record → `"v=spf1 include:amazonses.com ~all"`

### Lambda Function
- **Runtime**: Python
- **Original Source**: AWS Solution from [AWS Blog](https://aws.amazon.com/blogs/messaging-and-targeting/forward-incoming-email-to-an-external-destination/)
- **Issue with Original Solution**: Forwarded all emails from support@tigerpanda.tv and attached the forwarded emails as attachments
- **Improvement**: Modified to use `SendRawEmail` for direct forwarding
- **Current Limitation**: Cannot authenticate as the sending server (no TLS access)
  - Emails show "via amazon.com" in the sender field
  - Potential improvement: Change to "via tigerpanda.tv"

## Implementation Plan

1. Get DynamoDB address from `amplify_outputs.json`
2. Set it as an environment variable on the Lambda handler
3. Modify Lambda code to:
   - Look up incoming email target
   - Find corresponding forward address
   - Process forwarding accordingly
4. Test the implementation
5. Create CloudFormation script to recreate all AWS infrastructure for Gauntlet's AWS

## Important Notes

### SES Sandbox Limitations
- By default, SES accounts are in "sandbox" mode (limited functionality)
- **Required Action**: Submit AWS support ticket to move out of sandbox
- **Process**:
  - Go to SES → Identities → Email address
  - Email addresses need confirmation to receive from SES while in sandbox
  - Support ticket enables sending to any recipient
  - Must provide legitimate business reason for needing to email unverified addresses

### Security Considerations
- AWS implements sandbox mode to prevent spam and scam activities
- Proper authentication and authorization needed for email forwarding service