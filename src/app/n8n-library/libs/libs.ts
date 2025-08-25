import whatsappChatbot from '../jsons/whatsapp-ai-chatbot.json';
import weeklyReports from '../jsons/weekly-marketing-report.json';
import youtubeCreator from '../jsons/long-form-youtube-ai-gen.json';
import gmailAutoLabel from '../jsons/gmail-auto-label-response.json';
import reviewResponse from '../jsons/ai-review-response.json';
import salesCallAnalyzer from '../jsons/ai-sales-call-analyzer.json';
import socialMediaGen from '../jsons/ai-social-media-gen.json';
import autoLinkedinDm from '../jsons/automated-linkedin-dm.json';




interface WorkflowDetailData {
  id: number;
  title: string;
  description: string;
  tags: string[];
  downloads: number;
  demoUrl: string;
  integrations: string[];
  jsonTemplate: object;
  featured: boolean;
  overview: string;
  useCase: string;
  setupInstructions: Array<{
    step: number;
    title: string;
    description: string;
    screenshot?: string;
  }>;
  keyBenefits: string[];
  requirements: string[];
  workflowNodes: string[];
  setupTime: string;
  difficulty: string;
  videoTutorial?: string;
}



export const workflowDetails: WorkflowDetailData[] = [
{
  id: 1,
  title: "Automated LinkedIn DM System",
  description: "Automate LinkedIn outreach by submitting a target audience description via an N8N form, scraping profiles with Apollo via Apify, generating AI-personalized messages, logging to Google Sheets, and sending connection requests via PhantomBuster.",
  tags: ["LinkedIn", "Outreach", "Automation"],
  downloads: 142,
  demoUrl: "#",
  integrations: ["Apollo.io (via Apify)", "PhantomBuster", "OpenAI", "Google Sheets"],
  jsonTemplate: autoLinkedinDm,
  featured: true,
  overview: "This workflow automates LinkedIn outreach at scale. It uses an N8N form to collect a target audience description, generates an Apollo.io search URL, scrapes profiles, creates AI-personalized connection messages, logs results to Google Sheets, and sends connection requests via PhantomBuster.\n\n1. Submit a target audience description via an N8N form.\n2. OpenAI converts the description into an Apollo.io search URL.\n3. Apollo via Apify scrapes up to 50 profiles.\n4. OpenAI generates personalized icebreaker messages.\n5. Messages and profile data are logged to Google Sheets.\n6. PhantomBuster sends LinkedIn connection requests with the messages.\n\nEffortlessly grow your LinkedIn network with targeted, automated outreach.",
  useCase: "Save hours on manual LinkedIn profile research and messaging, increase connection rates with personalized outreach, and track campaigns with automated logging.",
  setupInstructions: [
    {
      step: 1,
      title: "Create an N8N account",
      description: "Create an N8N account at https://n8n.io."
    },
    {
      step: 2,
      title: "Create a new workflow",
      description: "Create a new workflow in N8N and import the provided JSON template."
    },
    {
      step: 3,
      title: "Set up OpenAI credentials",
      description: "Set up the OpenAI API for the 'Generate Apollo Search URL' and 'Generate Icebreaker' nodes. Get your API key from https://platform.openai.com/account/api-keys, select 'Authentication' as API Key, and create a new credential named 'OpenAI Account'. Paste the API key (e.g., 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')."
    },
    {
      step: 4,
      title: "Set up Apify credentials",
      description: "Set up Apify for the 'Scrape Apollo Profiles' node. Create an account and get your API key from the Apify dashboard (https://console.apify.com). In the node, set 'Authentication' to 'Bearer Auth', create a new credential named 'Apify API Key', and paste the key (e.g., 'Bearer apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')."
    },
    {
      step: 5,
      title: "Set up Google Sheets credentials",
      description: "Connect Google Sheets via OAuth2 for the 'Log to Google Sheets' and 'Log Error' nodes. Follow the OAuth flow (see https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/) and create a new credential named 'Google Sheets Account'. Select the target Google Sheet."
    },
    {
      step: 6,
      title: "Set up PhantomBuster credentials",
      description: "Set up PhantomBuster for the 'Send via PhantomBuster' node. Create an account and get your API key from the PhantomBuster dashboard (https://dashboard.phantombuster.com). In the node, under 'Header Parameters', paste the API key as 'X-Phantombuster-Key'."
    },
    {
      step: 7,
      title: "Test the workflow",
      description: "Click 'Test Workflow' in N8N. Submit a target audience description (e.g., 'Software Engineers in San Francisco') and tone in the form. Verify that the Apollo search URL is generated, profiles are scraped, icebreakers are created, logged to Google Sheets, and sent via PhantomBuster."
    },
    {
      step: 8,
      title: "Optional: Customize OpenAI prompts",
      description: "Modify the prompts in the 'Generate Apollo Search URL' and 'Generate Icebreaker' nodes to refine the search URL accuracy or tailor the tone and style of the icebreaker messages to your brand."
    }
  ],
  keyBenefits: [
    "Increase lead connection rates by up to 40% with personalized messaging",
    "Save 10+ hours per week on manual LinkedIn outreach",
    "Automate targeted profile scraping and message generation",
    "Track outreach campaigns with Google Sheets logging"
  ],
  requirements: [
    "Apollo.io (via Apify) API Key",
    "PhantomBuster API Key",
    "OpenAI API Key",
    "Google Sheets OAuth2 API"
  ],
  workflowNodes: [
    "Form Trigger",
    "OpenAI",
    "HTTP Request (Apify)",
    "Limit",
    "HTTP Request (PhantomBuster)",
    "Google Sheets"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Beginner",
  videoTutorial: "https://www.youtube.com/embed/example"
},
   {
  id: 7,
  title: "AI Social Media Content Generator",
  description: "Automate the creation of social media posts for Twitter and Facebook using AI, with content logged to Google Sheets and success notifications sent via Slack.",
  tags: ["Social Media", "AI Content", "Marketing Automation"],
  downloads: 142,
  demoUrl: "#",
  integrations: ["Twitter API", "Facebook API", "OpenAI", "Google Sheets", "Slack"],
  jsonTemplate: autoLinkedinDm,
  featured: true,
  overview: "This workflow automates the generation and posting of social media content for Twitter and Facebook. It uses an N8N form to collect content preferences, generates posts with OpenAI, formats them, posts to the selected platforms, logs results to Google Sheets, and sends Slack notifications.\n\n1. A user submits a content topic, tone, and platform via an N8N form.\n2. OpenAI generates a short, engaging post with a call-to-action.\n3. The content is formatted and checked.\n4. Posts are published to Twitter and/or Facebook based on user selection.\n5. Results are logged to Google Sheets.\n6. A Slack notification confirms successful posting.\n\nStreamline your social media strategy with AI-driven content creation.",
  useCase: "Save time on creating and posting social media content, ensure consistent brand messaging, and track posts with automated logging.",
  setupInstructions: [
    {
      step: 1,
      title: "Create an N8N account",
      description: "Create an N8N account at https://n8n.io."
    },
    {
      step: 2,
      title: "Create a new workflow",
      description: "Create a new workflow in N8N and import the provided JSON template."
    },
    {
      step: 3,
      title: "Set up Twitter credentials",
      description: "Set up Twitter API for the 'Twitter Post' node. Create credentials in N8N, select 'Twitter OAuth1 API', and create a new credential named 'Twitter Account'. Follow the OAuth flow at https://developer.twitter.com/en/docs/authentication/oauth-1-0a."
    },
    {
      step: 4,
      title: "Set up Facebook credentials",
      description: "Set up Facebook Graph API for the 'Facebook Post' node. Create credentials in N8N, select 'Facebook Graph API', and create a new credential named 'Facebook Account'. Follow the setup guide at https://developers.facebook.com/docs/graph-api."
    },
    {
      step: 5,
      title: "Set up OpenAI credentials",
      description: "Set up the OpenAI API for the 'OpenAI Generate' node. Get your API key from https://platform.openai.com/account/api-keys, select 'Authentication' as API Key, and create a new credential named 'OpenAI Account'. Paste the API key (e.g., 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')."
    },
    {
      step: 6,
      title: "Set up Google Sheets credentials",
      description: "Connect Google Sheets via OAuth2 for the 'Log Success' and 'Log Error' nodes. Follow the OAuth flow (see https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/) and create a new credential named 'Google Sheets Account'. Select the target Google Sheet."
    },
    {
      step: 7,
      title: "Set up Slack credentials",
      description: "Create a Slack API token at https://api.slack.com/authentication/token-types. In the 'Notify Success' node, set 'Authentication' to API Token, create a new credential named 'Slack Account', and paste the token. Specify the target Slack channel."
    },
    {
      step: 8,
      title: "Test the workflow",
      description: "Submit a test form in N8N with a content topic, tone, and platform selection. Verify that the post is generated, published to the selected platforms, logged to Google Sheets, and a Slack notification is sent."
    },
    {
      step: 9,
      title: "Optional: Customize OpenAI prompt",
      description: "Modify the prompt in the 'OpenAI Generate' node to adjust the tone, style, or content of the generated posts to align with your brand."
    }
  ],
  keyBenefits: [
    "Save time on social media content creation and posting",
    "Ensure consistent, engaging posts with AI generation",
    "Track content performance with Google Sheets logging",
    "Automate multi-platform posting with minimal effort"
  ],
  requirements: [
    "Twitter OAuth1 API",
    "Facebook Graph API",
    "OpenAI API Key",
    "Google Sheets OAuth2 API",
    "Slack API Token"
  ],
  workflowNodes: [
    "Form Trigger",
    "OpenAI",
    "Twitter",
    "Facebook",
    "Google Sheets",
    "Slack"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Intermediate",
  videoTutorial: "https://www.youtube.com/embed/example"
},
   {
  id: 4,
  title: "AI Sales Call Analyzer",
  description: "Automate analysis of Zoom sales call recordings, transcribe audio, evaluate key metrics with AI, log insights to Google Sheets, and notify via Slack.",
  tags: ["Sales", "AI Analysis", "Call Recording"],
  downloads: 142,
  demoUrl: "#",
  integrations: ["Zoom", "OpenAI", "Google Sheets", "Slack"],
  jsonTemplate: autoLinkedinDm,
  featured: true,
  overview: "This workflow automates the analysis of Zoom sales call recordings. It retrieves recent recordings, transcribes them using OpenAI's Whisper, analyzes key metrics (e.g., talk-to-listen ratio, sentiment), and logs insights to Google Sheets, with success notifications sent via Slack.\n\n1. A scheduled trigger runs hourly to check for new Zoom recordings.\n2. Recordings are downloaded and transcribed using OpenAI.\n3. AI analyzes the transcription for metrics like sentiment, objection handling, and engagement.\n4. Results, including metrics and coaching insights, are logged to Google Sheets.\n5. A Slack notification confirms successful analysis.\n\nImprove sales performance with automated, data-driven call insights.",
  useCase: "Save time on manual call reviews, gain actionable insights for sales coaching, and track performance metrics with automated logging.",
  setupInstructions: [
    {
      step: 1,
      title: "Create an N8N account",
      description: "Create an N8N account at https://n8n.io."
    },
    {
      step: 2,
      title: "Create a new workflow",
      description: "Create a new workflow in N8N and import the provided JSON template."
    },
    {
      step: 3,
      title: "Set up Zoom credentials",
      description: "Set up Zoom API for the 'Get Zoom Recordings' and 'Download Recording' nodes. Create credentials in N8N, select 'Zoom API', and create a new credential named 'Zoom Account'. Get your access token from https://marketplace.zoom.us/docs/guides/auth/oauth and follow the setup guide."
    },
    {
      step: 4,
      title: "Set up OpenAI credentials",
      description: "Set up the OpenAI API for the 'Transcribe Call' and 'Analyze Metrics' nodes. Get your API key from https://platform.openai.com/account/api-keys, select 'Authentication' as API Key, and create a new credential named 'OpenAI Account'. Paste the API key (e.g., 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')."
    },
    {
      step: 5,
      title: "Set up Google Sheets credentials",
      description: "Connect Google Sheets via OAuth2 for the 'Log to Google Sheets' and 'Log Error' nodes. Follow the OAuth flow (see https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/) and create a new credential named 'Google Sheets Account'. Select the target Google Sheet."
    },
    {
      step: 6,
      title: "Set up Slack credentials",
      description: "Create a Slack API token at https://api.slack.com/authentication/token-types. In the 'Notify Success' node, set 'Authentication' to API Token, create a new credential named 'Slack Account', and paste the token. Specify the target Slack channel."
    },
    {
      step: 7,
      title: "Test the workflow",
      description: "Use the 'Test Workflow' button in N8N or wait for the hourly schedule to trigger. Ensure a recent Zoom recording is available, then verify that transcription, analysis, logging, and Slack notifications work as expected."
    },
    {
      step: 8,
      title: "Optional: Customize OpenAI prompts",
      description: "Modify the prompt in the 'Analyze Metrics' node to adjust the metrics, tone, or focus of the AI analysis to align with your sales coaching needs."
    }
  ],
  keyBenefits: [
    "Save hours on manual call analysis",
    "Gain actionable insights for sales coaching",
    "Track performance metrics automatically",
    "Streamline reporting with Google Sheets and Slack"
  ],
  requirements: [
    "Zoom API",
    "OpenAI API Key",
    "Google Sheets OAuth2 API",
    "Slack API Token"
  ],
  workflowNodes: [
    "Schedule Trigger",
    "Zoom",
    "HTTP Request (Zoom Download)",
    "OpenAI",
    "Google Sheets",
    "Slack"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Intermediate",
  videoTutorial: "https://www.youtube.com/embed/example"
},
    {
  id: 8,
  title: "Weekly Marketing Reports",
  description: "Automate weekly marketing reports by pulling data from Google Analytics, Google Ads, and Meta Ads, generating AI-driven summaries, logging to Google Sheets, and notifying via Slack.",
  tags: ["Analytics", "Reporting", "Automation"],
  downloads: 142,
  demoUrl: "#",
  integrations: ["Google Analytics", "Google Ads", "Meta Ads", "OpenAI", "Google Sheets", "Slack"],
  jsonTemplate: autoLinkedinDm,
  featured: true,
  overview: "This workflow automates the creation of weekly marketing reports by fetching data from Google Analytics, Google Ads, and Meta Ads. It generates an AI-driven summary, logs raw data and summaries to Google Sheets, and sends notifications via Slack.\n\n1. A weekly schedule triggers the workflow.\n2. Data is pulled from Google Analytics (sessions, conversions, revenue), Google Ads (impressions, clicks, cost), and Meta Ads (impressions, clicks, spend).\n3. Data is formatted and validated.\n4. OpenAI generates a concise summary with insights and optimizations.\n5. Raw data and summaries are saved to Google Sheets.\n6. A Slack notification shares the report link and summary.\n\nSimplify marketing performance tracking with automated, insightful reports.",
  useCase: "Save time on compiling marketing data, gain actionable insights with AI summaries, and streamline reporting with automated logging and notifications.",
  setupInstructions: [
    {
      step: 1,
      title: "Create an N8N account",
      description: "Create an N8N account at https://n8n.io."
    },
    {
      step: 2,
      title: "Create a new workflow",
      description: "Create a new workflow in N8N and import the provided JSON template."
    },
    {
      step: 3,
      title: "Set up Google Analytics credentials",
      description: "Set up Google Analytics OAuth2 API for the 'Get GA4 Data' node. Create credentials in N8N, select 'Authentication' as OAuth2, and create a new credential named 'Google Analytics Account'. Follow the OAuth flow as described in https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/."
    },
    {
      step: 4,
      title: "Set up Google Ads credentials",
      description: "Set up Google Ads API for the 'Get Google Ads Data' node. Get your API key from https://developers.google.com/google-ads/api/docs/first-call/overview, add it under 'Header Parameters' with the name 'Authorization' and value 'Bearer YOUR_API_KEY'."
    },
    {
      step: 5,
      title: "Set up Meta Ads credentials",
      description: "Set up Meta Ads API for the 'Get Meta Ads Data' node. Get your access token from https://developers.facebook.com/docs/marketing-api/overview, add it to the node’s URL parameter as 'access_token=YOUR_ACCESS_TOKEN'."
    },
    {
      step: 6,
      title: "Set up OpenAI credentials",
      description: "Set up the OpenAI API for the 'Generate Summary' node. Get your API key from https://platform.openai.com/account/api-keys, select 'Authentication' as API Key, and create a new credential named 'OpenAI Account'. Paste the API key (e.g., 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')."
    },
    {
      step: 7,
      title: "Set up Google Sheets credentials",
      description: "Connect Google Sheets via OAuth2 for the 'Save Raw Data', 'Save Summary', and 'Log Error' nodes. Follow the OAuth flow (see https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/) and create a new credential named 'Google Sheets Account'. Select the target Google Sheet."
    },
    {
      step: 8,
      title: "Set up Slack credentials",
      description: "Create a Slack API token at https://api.slack.com/authentication/token-types. In the 'Notify Success' node, set 'Authentication' to API Token, create a new credential named 'Slack Account', and paste the token. Specify the target Slack channel."
    },
    {
      step: 9,
      title: "Test the workflow",
      description: "Use the 'Test Workflow' button in N8N or wait for the weekly schedule to trigger. Verify that data is fetched, the summary is generated, data is logged to Google Sheets, and Slack notifications are sent.",
    //   screenshot: "/screenshots/step7.png"
    },
    {
      step: 10,
      title: "Optional: Customize OpenAI prompt",
      description: "Modify the prompt in the 'Generate Summary' node to adjust the tone, focus, or insights in the AI-generated summary to align with your reporting needs.",
    //   screenshot: "/screenshots/step8.png"
    }
  ],
  keyBenefits: [
    "Save hours on compiling marketing reports",
    "Gain actionable insights with AI-driven summaries",
    "Automate data collection across multiple platforms",
    "Streamline reporting with Google Sheets and Slack"
  ],
  requirements: [
    "Google Analytics OAuth2 API",
    "Google Ads API Key",
    "Meta Ads Access Token",
    "OpenAI API Key",
    "Google Sheets OAuth2 API",
    "Slack API Token"
  ],
  workflowNodes: [
    "Schedule Trigger",
    "Google Analytics",
    "HTTP Request (Google Ads)",
    "HTTP Request (Meta Ads)",
    "OpenAI",
    "Google Sheets",
    "Slack"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Intermediate",
  videoTutorial: "https://www.youtube.com/embed/example"
},
  {
  id: 5,
  title: "WhatsApp Sales AI Chatbot",
  description: "Automate WhatsApp sales conversations with an AI chatbot that qualifies leads, responds to inquiries, logs interactions to Google Sheets, and notifies via Slack for high-value leads.",
  tags: ["WhatsApp", "AI Chatbot", "Sales"],
  downloads: 142,
  demoUrl: "#",
  integrations: ["WhatsApp Business API", "OpenAI", "Google Sheets", "Slack"],
  jsonTemplate: autoLinkedinDm,
  featured: true,
  overview: "This workflow automates sales conversations on WhatsApp using an AI chatbot. It processes incoming messages, qualifies leads, responds with tailored messages, logs interactions to Google Sheets, and notifies a human agent via Slack for high-value leads.\n\n1. A WhatsApp message triggers the workflow via a webhook.\n2. The message is checked for validity.\n3. OpenAI analyzes the message, qualifies the lead (based on intent, budget, urgency), and generates a response.\n4. The response is sent back via WhatsApp.\n5. Lead details are logged to Google Sheets.\n6. High-value leads trigger a Slack notification for human follow-up.\n7. Success is logged, and Slack notifications confirm processing.\n\nEnhance customer engagement and streamline sales with AI-driven WhatsApp automation.",
  useCase: "Save time on lead qualification and customer inquiries, improve response consistency, and escalate high-value leads for human follow-up, all while tracking interactions.",
  setupInstructions: [
    {
      step: 1,
      title: "Create an N8N account",
      description: "Create an N8N account at https://n8n.io."
    },
    {
      step: 2,
      title: "Create a new workflow",
      description: "Create a new workflow in N8N and import the provided JSON template."
    },
    {
      step: 3,
      title: "Set up WhatsApp Business API credentials",
      description: "Set up the WhatsApp Business API for the 'WhatsApp Trigger' and 'Send WhatsApp Response' nodes. Create credentials in N8N, select 'WhatsApp Business API', and create a new credential named 'WhatsApp Business Account'. Follow the setup guide at https://developers.facebook.com/docs/whatsapp/business-management-api/get-started."
    },
    {
      step: 4,
      title: "Set up OpenAI credentials",
      description: "Set up the OpenAI API for the 'Process Message' node. Get your API key from https://platform.openai.com/account/api-keys, select 'Authentication' as API Key, and create a new credential named 'OpenAI Account'. Paste the API key (e.g., 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')."
    },
    {
      step: 5,
      title: "Set up Google Sheets credentials",
      description: "Connect Google Sheets via OAuth2 for the 'Log Lead' and 'Log Error' nodes. Follow the OAuth flow (see https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/) and create a new credential named 'Google Sheets Account'. Select the target Google Sheet."
    },
    {
      step: 6,
      title: "Set up Slack credentials",
      description: "Create a Slack API token at https://api.slack.com/authentication/token-types. In the 'Notify Human' and 'Notify Success' nodes, set 'Authentication' to API Token, create a new credential named 'Slack Account', and paste the token. Specify the target Slack channel."
    },
    {
      step: 7,
      title: "Test the workflow",
      description: "Send a test WhatsApp message to your business number or use the 'Test Workflow' button in N8N. Verify that the message is processed, a response is sent, lead details are logged, and Slack notifications are triggered for high-value leads.",
    //   screenshot: "/screenshots/step7.png"
    },
    {
      step: 8,
      title: "Optional: Customize OpenAI prompts",
      description: "Modify the prompt in the 'Process Message' node to adjust the chatbot's tone, response style, or lead qualification criteria to align with your business needs.",
    //   screenshot: "/screenshots/step8.png"
    }
  ],
  keyBenefits: [
    "Save time on lead qualification and customer inquiries",
    "Ensure consistent, professional WhatsApp responses",
    "Escalate high-value leads for human follow-up",
    "Track interactions and lead details in Google Sheets"
  ],
  requirements: [
    "WhatsApp Business API",
    "OpenAI API Key",
    "Google Sheets OAuth2 API",
    "Slack API Token"
  ],
  workflowNodes: [
    "WhatsApp Trigger",
    "OpenAI",
    "HTTP Request (WhatsApp API)",
    "Google Sheets",
    "Slack"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Intermediate",
  videoTutorial: "https://www.youtube.com/embed/example"
},
   {
  id: 2,
  title: "Gmail Auto Label and Response Drafter",
  description: "Automate Gmail email labeling and draft AI-generated responses for incoming messages, with logging to Google Sheets and notifications via Slack.",
  tags: ["Gmail", "Email Automation", "AI"],
  downloads: 142,
  demoUrl: "#",
  integrations: ["Gmail", "OpenAI", "Google Sheets", "Slack"],
  jsonTemplate: autoLinkedinDm,
  featured: true,
  overview: "This workflow automates Gmail email management by assigning smart labels and drafting AI-generated responses for incoming emails. It uses a Gmail trigger to detect new messages, assigns labels based on content and intent, drafts replies when needed, logs results to Google Sheets, and sends Slack notifications.\n\n1. A Gmail trigger detects new emails in the inbox.\n2. Email details are fetched and formatted.\n3. OpenAI assigns smart labels (e.g., Urgent, Inquiry) and determines if a reply is needed.\n4. Labels are applied to the email.\n5. If a reply is needed, OpenAI drafts a professional response.\n6. The draft is created in Gmail, results are logged to Google Sheets, and a Slack notification is sent.\n\nStreamline email management with AI-driven automation.",
  useCase: "Save time on email organization and response drafting, ensure consistent communication, and track email handling with automated logging.",
  setupInstructions: [
    {
      step: 1,
      title: "Create an N8N account",
      description: "Create an N8N account at https://n8n.io."
    },
    {
      step: 2,
      title: "Create a new workflow",
      description: "Create a new workflow in N8N and import the provided JSON template."
    },
    {
      step: 3,
      title: "Set up Gmail credentials",
      description: "Set up Gmail OAuth2 API for the 'Gmail Trigger', 'Get Email', 'Apply Labels', and 'Create Gmail Draft' nodes. Create credentials in N8N, set 'Authentication' to OAuth2, and create a new credential named 'Gmail Account'. Follow the OAuth flow as described in https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/."
    },
    {
      step: 4,
      title: "Set up OpenAI credentials",
      description: "Set up the OpenAI API for the 'Assign Labels' and 'Draft Reply' nodes. Get your API key from https://platform.openai.com/account/api-keys, select 'Authentication' as API Key, and create a new credential named 'OpenAI Account'. Paste the API key (e.g., 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')."
    },
    {
      step: 5,
      title: "Set up Google Sheets credentials",
      description: "Connect Google Sheets via OAuth2 for the 'Log Success' and 'Log Error' nodes. Follow the OAuth flow (see https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/) and create a new credential named 'Google Sheets Account'. Select the target Google Sheet."
    },
    {
      step: 6,
      title: "Set up Slack credentials",
      description: "Create a Slack API token at https://api.slack.com/authentication/token-types. In the 'Notify Success' node, set 'Authentication' to API Token, create a new credential named 'Slack Account', and paste the token. Specify the target Slack channel."
    },
    {
      step: 7,
      title: "Test the workflow",
      description: "Send a test email to your Gmail inbox or use the 'Test Workflow' button in N8N. Verify that labels are applied, replies are drafted (if needed), logs are saved to Google Sheets, and Slack notifications are sent.",
    //   screenshot: "/screenshots/step7.png"
    },
    {
      step: 8,
      title: "Optional: Customize OpenAI prompts",
      description: "Modify the prompts in the 'Assign Labels' and 'Draft Reply' nodes to adjust label categories or response tone to better align with your preferences or brand voice.",
    //   screenshot: "/screenshots/step8.png"
    }
  ],
  keyBenefits: [
    "Save hours on email organization and response drafting",
    "Ensure consistent and professional email communication",
    "Automate smart labeling for efficient inbox management",
    "Track email handling with Google Sheets logging"
  ],
  requirements: [
    "Gmail OAuth2 API",
    "OpenAI API Key",
    "Google Sheets OAuth2 API",
    "Slack API Token"
  ],
  workflowNodes: [
    "Gmail Trigger",
    "Gmail",
    "OpenAI",
    "Google Sheets",
    "Slack"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Intermediate",
  videoTutorial: "https://www.youtube.com/embed/example"
},
 {
  id: 3,
  title: "Long Form YouTube AI Creator",
  description: "Automate the creation of long-form YouTube content by generating scripts and metadata using AI, with results logged to Google Sheets.",
  tags: ["YouTube", "Content Creation", "Automation"],
  downloads: 142,
  demoUrl: "#",
  integrations: ["OpenAI", "Google Sheets"],
  jsonTemplate: autoLinkedinDm,
  featured: true,
  overview: "This workflow automates the creation of long-form YouTube content using AI. It takes a user-submitted topic via an N8N form, generates a video script and metadata (title, description, tags) using OpenAI, and logs the output to Google Sheets for easy review and publishing.\n\n1. A topic is submitted via an N8N form.\n2. OpenAI generates a detailed video script and metadata.\n3. The generated content is formatted and saved to Google Sheets.\n\nStreamline your YouTube content creation with AI-driven automation.",
  useCase: "Save time on scripting and planning YouTube videos, ensure consistent content output, and simplify content management with automated logging.",
  setupInstructions: [
    {
      step: 1,
      title: "Create an N8N account",
      description: "Create an N8N account at https://n8n.io."
    },
    {
      step: 2,
      title: "Create a new workflow",
      description: "Create a new workflow in N8N and import the provided JSON template."
    },
    {
      step: 3,
      title: "Set up OpenAI credentials",
      description: "Set up the OpenAI API by clicking into the OpenAI step, setting up your OpenAI credentials (get your API key at https://platform.openai.com/account/api-keys), then setting the 'Authentication' dropdown to API Key. Create a new credential named 'OpenAI API Key'. Copy and paste the API key into the value field, e.g., 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'."
    },
    {
      step: 4,
      title: "Set up Google Sheets credentials",
      description: "Connect Google Sheets via OAuth. Use the docs at https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/. Create a new credential named 'Google Sheets OAuth2 API'. Follow the OAuth flow and select the Google Sheet you want to connect to."
    },
    {
      step: 5,
      title: "Test the workflow",
      description: "Click 'Test Workflow' at the bottom of the workflow editor. Enter a topic in the N8N form based on your content goals, then click 'Submit'. Verify each step executes correctly.",
    //   screenshot: "/screenshots/step7.png"
    },
    {
      step: 6,
      title: "Optional: Modify the OpenAI prompts",
      description: "Modify the prompts in the OpenAI step to customize the tone, style, or structure of the generated scripts and metadata to align with your channel's branding.",
    //   screenshot: "/screenshots/step8.png"
    }
  ],
  keyBenefits: [
    "Save hours on scripting and metadata creation",
    "Generate consistent, high-quality YouTube content",
    "Simplify content management with Google Sheets logging",
    "Scale video production with AI automation"
  ],
  requirements: [
    "OpenAI API Key",
    "Google Sheets OAuth2 API"
  ],
  workflowNodes: [
    "N8N Form Trigger",
    "OpenAI",
    "Google Sheets"
  ],
  setupTime: "20-30 minutes",
  difficulty: "Beginner",
  videoTutorial: "https://www.youtube.com/embed/example"
},
  
   {
  id: 6,
  title: "AI Review Response Generator",
  description: "Automate the process of generating and posting professional, empathetic responses to Google and Yelp reviews using AI, with logging to Google Sheets and notifications via Slack.",
  tags: ["Review Management", "AI Responses", "Reputation Management"],
  downloads: 142,
  demoUrl: "#",
  integrations: ["Google My Business", "Yelp API", "OpenAI", "Google Sheets", "Slack"],
  jsonTemplate: reviewResponse,
  featured: true,
  overview: "This workflow automates the generation and posting of AI-driven responses to customer reviews on Google My Business and Yelp. It uses a webhook to trigger the process, fetches review details, formats them, generates a professional response using OpenAI, posts the response to the respective platform, logs the results in Google Sheets, and sends a Slack notification.\n\n1. A webhook receives review data (platform, review ID, etc.).\n2. The workflow checks the platform (Google or Yelp) and fetches review details.\n3. Review data is formatted for consistency.\n4. OpenAI generates a professional, empathetic response.\n5. The response is posted back to the review platform.\n6. Results are logged to Google Sheets, and a Slack notification is sent for successful responses.\n\nStreamline your reputation management with automated, high-quality review responses.",
  useCase: "Save time on manually responding to customer reviews, ensure consistent and professional communication, and maintain a positive brand reputation across Google and Yelp.",
  setupInstructions: [
    {
      step: 1,
      title: "Create an N8N account",
      description: "Create an N8N account at https://n8n.io."
    },
    {
      step: 2,
      title: "Create a new workflow",
      description: "Create a new workflow in N8N and import the provided JSON template."
    },
    {
      step: 3,
      title: "Set up Google Business Profile credentials",
      description: "Set up the Google Business Profile OAuth2 API by creating credentials in N8N. Go to the workflow, select the 'Get Google Review' and 'Post Google Reply' nodes, set 'Authentication' to OAuth2, and create a new credential named 'Google Business Profile Account'. Follow the OAuth flow as described in https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/."
    },
    {
      step: 4,
      title: "Set up Yelp API credentials",
      description: "Create a Yelp API key at https://www.yelp.com/developers. In the 'Get Yelp Review' and 'Post Yelp Reply' nodes, add the API key under 'Header Parameters' with the name 'Authorization' and value 'Bearer YOUR_API_KEY'."
    },
    {
      step: 5,
      title: "Set up OpenAI credentials",
      description: "Set up the OpenAI API in the 'Generate Response' node. Get your API key from https://platform.openai.com/account/api-keys, select 'Authentication' as API Key, and create a new credential named 'OpenAI Account'. Paste the API key (e.g., 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')."
    },
    {
      step: 6,
      title: "Set up Google Sheets credentials",
      description: "Connect Google Sheets via OAuth2. In the 'Log Success' and 'Log Error' nodes, set 'Authentication' to OAuth2 and create a new credential named 'Google Sheets Account'. Follow the OAuth flow (see https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/) and select the target Google Sheet."
    },
    {
      step: 7,
      title: "Set up Slack credentials",
      description: "Create a Slack API token at https://api.slack.com/authentication/token-types. In the 'Notify Success' node, set 'Authentication' to API Token, create a new credential named 'Slack Account', and paste the token. Specify the target Slack channel."
    },
    {
      step: 8,
      title: "Test the workflow",
      description: "Send a test webhook POST request to the webhook URL (found in the 'Webhook Trigger' node) with a JSON payload containing 'platform' ('google' or 'yelp'), 'accountId', 'locationId', 'reviewId' (for Google), or 'businessId' (for Yelp). Verify each step executes correctly.",
    //   screenshot: "/screenshots/step8.png"
    },
    {
      step: 9,
      title: "Optional: Customize the OpenAI prompt",
      description: "Modify the prompt in the 'Generate Response' node to tailor the tone or content of AI-generated responses to better align with your brand voice.",
    //   screenshot: "/screenshots/step9.png"
    }
  ],
  keyBenefits: [
    "Save hours on manual review responses",
    "Ensure consistent, professional, and empathetic replies",
    "Enhance brand reputation with timely responses",
    "Track responses and errors in Google Sheets"
  ],
  requirements: [
    "Google Business Profile OAuth2 API",
    "Yelp API Key",
    "OpenAI API Key",
    "Google Sheets OAuth2 API",
    "Slack API Token"
  ],
  workflowNodes: [
    "Webhook Trigger",
    "Google Business Profile",
    "HTTP Request (Yelp API)",
    "OpenAI",
    "Google Sheets",
    "Slack"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Intermediate",
  videoTutorial: "https://www.youtube.com/embed/example"
}


  // Add similar detailed data for other workflows...
];