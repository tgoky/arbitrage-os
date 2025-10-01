import whatsappChatbot from '../jsons/whatsapp-ai-chatbot.json';
import weeklyReports from '../jsons/weekly-marketing-report.json';
import youtubeCreator from '../jsons/long-form-youtube-ai-gen.json';
import gmailAutoLabel from '../jsons/gmail-auto-label-response.json';
import reviewResponse from '../jsons/ai-review-response.json';
import salesCallAnalyzer from '../jsons/ai-sales-call-analyzer.json';
import socialMediaGen from '../jsons/ai-social-media-gen.json';
import autoLinkedinDm from '../jsons/automated-linkedin-dm.json';

import autopostAi from '../jsons/Generate-Auto-post AI Videos-Social-Media-with-Veo3-Blotato.json';
import aiagentDev from '../jsons/AI-Agent-Development Agent.json';
import aiblogPost from '../jsons/AI-Blog-Post-R&D-Agent.json';
import analyzeLanding from '../jsons/Analyze-Landing-Page-with-OpenAI-and-Get-Optimization Tips.json';
import autoRespond from '../jsons/Auto-Respond to Gmail Inquiries using OpenAI, Google Sheet & AI Agent.json';
import auoRespondDocs from '../jsons/Auto-Respond to Slack Messages as Yourself using GPT and Google Docs RAG.json';
import automatedLink from '../jsons/Automated-LinkedIn-Content Creation-with-GPT-4-and-DALL-E-for-Scheduled Posts.json';
import generateAuto from '../jsons/Generate-Auto-post AI Videos-Social-Media-with-Veo3-Blotato.json';
import gmailEmail from '../jsons/Gmail_and_Email_Automation_Extract-spending-history from-gmail-google sheet.json';
import googleMaps from '../jsons/Google-Maps-Lead-Generation.json';
import imageCaps from '../jsons/Image-Captioning-with-Gemini.json';
import linkLead from '../jsons/Linkedin-Lead-Gen.json';
import longForm from '../jsons/Long-Form-Faceless-Content-Generator.json';
import n8node from '../jsons/N8N-Node-Library.json';
import n8nwork from '../jsons/N8N-Node-Library.json';
import openais from '../jsons/OpenAI_and_LLMs_AI-Youtube-Trend-Finde- Based On Niche.json';
import resumeParser from '../jsons/Resume-Parser.json';
import trackAi from '../jsons/Track-AI-Agent-token-usage-estimate-costs-Google-Sheets.json';
import turnt from '../jsons/Turn-YouTube-Transcripts into-Newsletter-Drafts-using Dumpling-AI-GPT-4o.json';
import voiceb from '../jsons/Voice-Based Appointment Booking System with ElevenLabs AI and Cal.com.json';


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
  videoTutorial: "https://drive.google.com/file/d/1hrYjuVS2jCzA-h0WdRSI3b8wIV5_Z7jF/view?usp=sharing"
},
   {
  id: 7,
  title: "AI Social Media Content Generator",
  description: "Automate the creation of social media posts for Twitter and Facebook using AI, with content logged to Google Sheets and success notifications sent via Slack.",
  tags: ["Social Media", "AI Content", "Marketing Automation"],
  downloads: 142,
  demoUrl: "#",
  integrations: ["Twitter API", "Facebook API", "OpenAI", "Google Sheets", "Slack"],
  jsonTemplate: socialMediaGen,
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
  videoTutorial: "https://drive.google.com/file/d/1Eag1TeIW4EX5Bam7BoKHNe_NlRCmJznd/view?usp=sharing"
},
   {
  id: 4,
  title: "AI Sales Call Analyzer",
  description: "Automate analysis of Zoom sales call recordings, transcribe audio, evaluate key metrics with AI, log insights to Google Sheets, and notify via Slack.",
  tags: ["Sales", "AI Analysis", "Call Recording"],
  downloads: 142,
  demoUrl: "#",
  integrations: ["Zoom", "OpenAI", "Google Sheets", "Slack"],
  jsonTemplate: salesCallAnalyzer,
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
  videoTutorial: "https://drive.google.com/file/d/1CZoUq9n4NxRnTSP91ZqTT8tU7V3UIGc8/view?usp=sharing"
},
    {
  id: 8,
  title: "Weekly Marketing Reports",
  description: "Automate weekly marketing reports by pulling data from Google Analytics, Google Ads, and Meta Ads, generating AI-driven summaries, logging to Google Sheets, and notifying via Slack.",
  tags: ["Analytics", "Reporting", "Automation"],
  downloads: 142,
  demoUrl: "#",
  integrations: ["Google Analytics", "Google Ads", "Meta Ads", "OpenAI", "Google Sheets", "Slack"],
  jsonTemplate: weeklyReports,
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
  videoTutorial: "https://drive.google.com/file/d/1TQbs4uF6WnTdFZpIwmKaKrmpvUdPqr4p/view?usp=sharing"
},
  {
  id: 5,
  title: "WhatsApp Sales AI Chatbot",
  description: "Automate WhatsApp sales conversations with an AI chatbot that qualifies leads, responds to inquiries, logs interactions to Google Sheets, and notifies via Slack for high-value leads.",
  tags: ["WhatsApp", "AI Chatbot", "Sales"],
  downloads: 142,
  demoUrl: "#",
  integrations: ["WhatsApp Business API", "OpenAI", "Google Sheets", "Slack"],
  jsonTemplate: whatsappChatbot,
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
  jsonTemplate: gmailAutoLabel,
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
  videoTutorial: "https://drive.google.com/file/d/11oNve-U5J_oI9kL4k9mpHn_Nrp_Wd6ij/view?usp=sharing"
},
 {
  id: 3,
  title: "Long Form YouTube AI Creator",
  description: "Automate the creation of long-form YouTube content by generating scripts and metadata using AI, with results logged to Google Sheets.",
  tags: ["YouTube", "Content Creation", "Automation"],
  downloads: 142,
  demoUrl: "#",
  integrations: ["OpenAI", "Google Sheets"],
  jsonTemplate: youtubeCreator,
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
  videoTutorial: "https://drive.google.com/file/d/1MhEvakLZ-39bO6aQLW7VhpZz_RiHRPFp/view?usp=sharing"
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
  videoTutorial: "https://drive.google.com/file/d/1OghLgEEmfxeG5ulbvTo7bHQxhSsRASkZ/view?usp=sharing"
},


  // Add similar detailed data for other workflows...





  {
  id: 9,
  title: "Auto-Post AI Videos for Social Media",
  description: "Automatically generate and schedule AI-powered videos for social media platforms using Veo3 and Blotato.",
  tags: ["Video Generation", "Social Media", "AI Content"],
  downloads: 92,
  demoUrl: "#",
  integrations: ["Veo3 API", "Blotato", "Social Media APIs"],
  jsonTemplate: autopostAi,
  featured: false,
  overview: "This workflow automates the creation and scheduling of AI-generated videos for social media platforms. It uses Veo3 for video generation and Blotato for social media management to create engaging content without manual intervention.\n\n1. A scheduled trigger initiates the workflow daily.\n2. AI analyzes trending topics and generates video concepts.\n3. Veo3 creates short-form videos based on the concepts.\n4. Videos are automatically posted to selected social media platforms via Blotato.\n5. Performance metrics are tracked and logged for optimization.\n\nMaintain a consistent social media presence with AI-generated video content.",
  useCase: "Save time on video content creation, maintain consistent posting schedules, and leverage AI to create engaging social media videos.",
  setupInstructions: [
    {
      step: 1,
      title: "Set up Veo3 API credentials",
      description: "Create an account at Veo3 and obtain your API key for video generation."
    },
    {
      step: 2,
      title: "Configure Blotato integration",
      description: "Connect your social media accounts to Blotato and obtain API access tokens."
    },
    {
      step: 3,
      title: "Import workflow template",
      description: "Import the JSON template into your n8n instance and configure the trigger settings."
    },
    {
      step: 4,
      title: "Test video generation",
      description: "Run a test to ensure videos are being created and posted correctly."
    }
  ],
  keyBenefits: [
    "Automate video content creation",
    "Maintain consistent social media presence",
    "Leverage AI for trending content ideas",
    "Save time on manual video production"
  ],
  requirements: [
    "Veo3 API Key",
    "Blotato Account",
    "Social Media Platform Access"
  ],
  workflowNodes: [
    "Schedule Trigger",
    "HTTP Request (Veo3 API)",
    "HTTP Request (Blotato API)",
    "Error Handling"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Intermediate",
    videoTutorial: "https://drive.google.com/file/d/10ytuZtnjnVpfJvuk49an16YGcHg9eNqh/view?usp=sharing"
},
{
  id: 10,
  title: "AI Agent Development Agent",
  description: "An AI-powered development environment combining GPT, Claude, memory, and tools to build, test, and deploy workflows automatically.",
  tags: ["AI Agent", "Automation", "Workflow Builder", "n8n"],
  downloads: 156,
  demoUrl: "#",
  integrations: ["OpenAI", "Anthropic (Claude)", "n8n", "Custom APIs", "File Upload"],
  jsonTemplate: aiagentDev,
  featured: true,
  overview: "This workflow brings together a **Developer Agent** and a **Workflow Builder** to create, test, and link custom workflows.\n\n1. **Developer Agent** responds to chat messages, with GPT 4.1 mini as the primary brain, memory for context, and a developer tool.\n2. **Workflow Builder** fetches n8n documentation, extracts knowledge from files, and leverages Claude Opus 4 for reasoning.\n3. Agents automatically create workflows in n8n and return live workflow links.\n4. Both GPT and Claude can be combined for hybrid reasoning across steps.\n5. Enables collaborative AI agent development and workflow deployment with minimal setup.",
  useCase: "Empower developers and no-code users to design, test, and deploy AI-driven workflows using both GPT and Claude models, with built-in memory and file-based knowledge extraction.",
  setupInstructions: [
    {
      step: 1,
      title: "Configure LLM Integrations",
      description: "Set up your OpenAI and Anthropic API keys in the workflow settings."
    },
    {
      step: 2,
      title: "Enable Memory + Tools",
      description: "Activate simple memory for persistent context and connect the Developer Tool."
    },
    {
      step: 3,
      title: "Connect Workflow Builder",
      description: "Configure the Workflow Builder to fetch n8n docs and extract data from files."
    },
    {
      step: 4,
      title: "Test Workflow Generation",
      description: "Send a chat command and verify the workflow link is generated correctly."
    }
  ],
  keyBenefits: [
    "Hybrid GPT + Claude reasoning",
    "Automated workflow creation in n8n",
    "Memory-enabled development agent",
    "File and docs knowledge extraction",
    "End-to-end AI agent + builder pipeline"
  ],
  requirements: [
    "OpenAI API Key",
    "Anthropic API Key",
    "n8n instance",
    "Webhook endpoint (for workflow link)"
  ],
  workflowNodes: [
    "Chat Trigger",
    "GPT 4.1 Mini (Brain)",
    "Simple Memory",
    "Developer Tool",
    "Claude Opus 4",
    "Docs Fetch",
    "Extract File",
    "n8n Builder",
    "Workflow Link"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Intermediate",
  videoTutorial: "https://drive.google.com/file/d/16qLEUFf_hSIxdWDNrj55bul26Hm2QNMG/view?usp=sharing"
}
,
{
  id: 17,
  title: "Google Maps Lead Generation",
  description: "Automatically scrape business emails from Google Maps queries and save them directly into Google Sheets.",
  tags: ["Lead Generation", "Scraping", "Google Maps", "Automation"],
  downloads: 243,
  demoUrl: "#",
  integrations: ["Google Maps", "Google Sheets", "Webhook"],
  jsonTemplate: googleMaps,
  featured: true,
  overview: "This workflow scrapes emails from businesses listed on Google Maps, based on custom queries you provide.\n\n1. User provides a list of queries (e.g., 'real estate agent in Salt Lake City').\n2. The workflow runs each query in the background.\n3. Business URLs are scraped and cleaned using regex filters.\n4. Each website is scanned for email addresses.\n5. Emails are deduplicated, filtered, and saved into Google Sheets.\n\nEasily generate business leads without manual copy-pasting.",
  useCase: "Perfect for marketers, sales teams, and agencies looking to quickly gather business leads from Google Maps into a structured format.",
  setupInstructions: [
    {
      step: 1,
      title: "Setup queries",
      description: "Enter your list of business queries inside the **Run workflow** node."
    },
    {
      step: 2,
      title: "Connect Google Sheets",
      description: "Choose a document and sheet in the **Google Sheets** node to save scraped emails."
    },
    {
      step: 3,
      title: "Adjust filters (optional)",
      description: "Modify regex in the **URL filter** or **email filter** nodes to refine results."
    },
    {
      step: 4,
      title: "Run the scraper",
      description: "Trigger the workflow and monitor executions in the n8n sidebar."
    }
  ],
  keyBenefits: [
    "Hands-free Google Maps lead generation",
    "Customizable regex filtering",
    "Saves results directly into Google Sheets",
    "Removes duplicate and irrelevant emails",
    "Scalable multi-query scraping"
  ],
  requirements: [
    "Google Sheets API credentials",
    "Google Maps access (no API key needed, uses scraping)",
    "n8n instance"
  ],
  workflowNodes: [
    "Run Workflow Trigger",
    "Loop over Queries",
    "Execute Scraper for Query",
    "Wait between Executions",
    "Search Google Maps with Query",
    "Scrape URLs from Results",
    "Filter Irrelevant URLs",
    "Remove Duplicate URLs",
    "Loop over URLs",
    "Request Web Page",
    "Scrape Emails from Page",
    "Aggregate Emails",
    "Split into Default Data Structure",
    "Remove Duplicate Emails",
    "Filter Irrelevant Emails",
    "Save to Google Sheets"
  ],
  setupTime: "20-30 minutes",
  difficulty: "Beginner",
  videoTutorial: "https://drive.google.com/file/d/1p8lyoGdjeIWUNybiWv2M0BbGGs4-XDSp/view?usp=sharing"
},
{
  id: 12,
  title: "Landing Page Analysis with OpenAI",
  description: "Analyze landing pages and receive AI-powered optimization tips to improve conversion rates.",
  tags: ["Conversion Optimization", "Web Analytics", "AI Analysis"],
  downloads: 87,
  demoUrl: "#",
  integrations: ["OpenAI", "Google Analytics", "PageSpeed Insights"],
  jsonTemplate: analyzeLanding,
  featured: false,
  overview: "This workflow provides automated analysis of landing pages with AI-powered recommendations for improvement. It evaluates design, content, performance, and conversion elements to suggest optimizations.\n\n1. URL input for landing page analysis.\n2. Comprehensive page scanning and data collection.\n3. AI analysis of design, content, and performance factors.\n4. Generation of specific optimization recommendations.\n5. Priority scoring for suggested changes.\n6. Export of detailed reports with actionable insights.\n\nImprove conversion rates with data-driven landing page optimizations.",
  useCase: "Quickly identify landing page issues, receive specific improvement recommendations, and prioritize changes based on potential impact.",
  setupInstructions: [
    {
      step: 1,
      title: "Configure page analysis tools",
      description: "Set up integrations with page analysis services like PageSpeed Insights."
    },
    {
      step: 2,
      title: "Set up OpenAI credentials",
      description: "Add your OpenAI API key for the analysis and recommendation engine."
    },
    {
      step: 3,
      title: "Define success metrics",
      description: "Configure what metrics matter most for your landing page optimization."
    },
    {
      step: 4,
      title: "Test with sample URLs",
      description: "Run the workflow with test landing pages to verify analysis quality."
    }
  ],
  keyBenefits: [
    "Data-driven optimization recommendations",
    "Comprehensive landing page analysis",
    "Priority-based improvement suggestions",
    "Easy integration with existing tools"
  ],
  requirements: [
    "OpenAI API Key",
    "Web Page Access",
    "Analysis Tool APIs"
  ],
  workflowNodes: [
    "Webhook Trigger",
    "HTTP Request (Page Analysis)",
    "OpenAI",
    "Data Processing",
    "Report Generation"
  ],
  setupTime: "20-30 minutes",
  difficulty: "Intermediate",
    videoTutorial: "https://drive.google.com/file/d/1NzNCCcuc7NAk1sxVWo_knkgVq8zCx-kK/view?usp=sharing"
},
{
  id: 13,
  title: "Auto-Respond to Gmail Inquiries",
  description: "Automatically respond to Gmail inquiries using OpenAI, with responses logged in Google Sheets.",
  tags: ["Email Automation", "Customer Service", "AI Responses"],
  downloads: 121,
  demoUrl: "#",
  integrations: ["Gmail API", "OpenAI", "Google Sheets"],
  jsonTemplate: autoRespond,
  featured: false,
  overview: "This workflow automates responses to common customer inquiries received via Gmail. It uses AI to understand email content, generate appropriate responses, send replies, and log interactions for tracking.\n\n1. Monitoring of incoming Gmail messages matching specific criteria.\n2. AI analysis of email content and intent classification.\n3. Generation of context-appropriate responses.\n4. Sending of automated replies with human-like quality.\n5. Logging of all interactions to Google Sheets for review.\n6. Escalation of complex issues to human agents.\n\nImprove response times and customer satisfaction with AI-powered email automation.",
  useCase: "Handle high volumes of customer inquiries, maintain consistent response quality, and free up human agents for more complex issues.",
  setupInstructions: [
    {
      step: 1,
      title: "Set up Gmail API access",
      description: "Configure OAuth credentials for Gmail API access and message monitoring."
    },
    {
      step: 2,
      title: "Configure OpenAI integration",
      description: "Add your OpenAI API key for email analysis and response generation."
    },
    {
      step: 3,
      title: "Set up Google Sheets logging",
      description: "Connect to Google Sheets for interaction logging and reporting."
    },
    {
      step: 4,
      title: "Define response templates",
      description: "https://drive.google.com/file/d/1OXMjSd-k84st97SAguec9C4_WtVqlqhY/view?usp=sharing."
    }
  ],
  keyBenefits: [
    "Faster response times",
    "Consistent communication quality",
    "Reduced manual email handling",
    "Comprehensive interaction tracking"
  ],
  requirements: [
    "Gmail API Access",
    "OpenAI API Key",
    "Google Sheets Access"
  ],
  workflowNodes: [
    "Gmail Trigger",
    "OpenAI",
    "Gmail Response",
    "Google Sheets",
    "Conditional Logic"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Intermediate"
},
{
  id: 14,
  title: "Auto-Respond to Slack Messages",
  description: "Automatically respond to Slack messages using GPT and Google Docs RAG to maintain your voice.",
  tags: ["Slack Automation", "AI Responses", "RAG"],
  downloads: 98,
  demoUrl: "#",
  integrations: ["Slack API", "OpenAI", "Google Docs"],
  jsonTemplate: auoRespondDocs,
  featured: false,
  overview: "This workflow provides automated responses to Slack messages using a Retrieval-Augmented Generation (RAG) approach with Google Docs. It maintains your personal communication style while handling common queries.\n\n1. Monitoring of Slack channels or direct messages for specific triggers.\n2. Retrieval of relevant information from Google Docs knowledge base.\n3. Generation of context-aware responses using your communication style.\n4. Posting of responses in appropriate Slack channels or threads.\n5. Learning from feedback to improve future responses.\n\nMaintain consistent communication in Slack while reducing manual response effort.",
  useCase: "Handle common Slack queries automatically, maintain consistent communication style, and ensure timely responses during absences.",
  setupInstructions: [
    {
      step: 1,
      title: "Set up Slack API access",
      description: "Configure Slack app permissions and obtain API credentials for message monitoring."
    },
    {
      step: 2,
      title: "Configure Google Docs integration",
      description: "Connect to Google Docs for knowledge retrieval and response style learning."
    },
    {
      step: 3,
      title: "Set up OpenAI for response generation",
      description: "Add your OpenAI API key for intelligent response creation."
    },
    {
      step: 4,
      title: "Train response style",
      description: "Provide sample communications to train the AI on your response style."
    }
  ],
  keyBenefits: [
    "Maintain personal communication style",
    "Reduce manual Slack response effort",
    "Ensure timely responses",
    "Continuous learning from interactions"
  ],
  requirements: [
    "Slack API Access",
    "OpenAI API Key",
    "Google Docs Access"
  ],
  workflowNodes: [
    "Slack Trigger",
    "Google Docs",
    "OpenAI",
    "Slack Response",
    "Feedback Loop"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Advanced",
  videoTutorial: "https://drive.google.com/file/d/1LAaAlf-xrxdaBcBV97vEcwnxF0ntuxW2/view?usp=sharing"
},
{
  id: 15,
  title: "Automated LinkedIn Content Creation",
  description: "Generate and schedule LinkedIn content with GPT-4 and DALL-E for consistent social media presence.",
  tags: ["LinkedIn", "Content Creation", "Scheduling"],
  downloads: 145,
  demoUrl: "#",
  integrations: ["LinkedIn API", "OpenAI", "DALL-E"],
  jsonTemplate: automatedLink,
  featured: true,
  overview: "This workflow automates the creation and scheduling of LinkedIn content using AI. It generates engaging posts, creates complementary images with DALL-E, and schedules them for optimal visibility.\n\n1. Content idea generation based on trending topics and your industry.\n2. Creation of engaging post copy with GPT-4.\n3. Generation of complementary images with DALL-E.\n4. Optimization of posting schedule for maximum engagement.\n5. Automatic posting to LinkedIn via API.\n6. Performance tracking and content optimization.\n\nMaintain an active LinkedIn presence with minimal effort using AI content creation.",
  useCase: "Consistently post high-quality content on LinkedIn, save time on content creation, and increase engagement with optimized posting schedules.",
  setupInstructions: [
    {
      step: 1,
      title: "Set up LinkedIn API access",
      description: "Configure LinkedIn API credentials for content posting and scheduling."
    },
    {
      step: 2,
      title: "Configure OpenAI and DALL-E",
      description: "Add your OpenAI API keys for text and image generation."
    },
    {
      step: 3,
      title: "Define content preferences",
      description: "Set your industry, tone preferences, and posting frequency."
    },
    {
      step: 4,
      title: "Test content generation",
      description: "Run a test to generate sample content and verify quality before posting."
    }
  ],
  keyBenefits: [
    "Consistent LinkedIn content",
    "Time-saving automation",
    "Engaging multimedia posts",
    "Optimized posting schedule"
  ],
  requirements: [
    "LinkedIn API Access",
    "OpenAI API Key",
    "DALL-E Access"
  ],
  workflowNodes: [
    "Schedule Trigger",
    "OpenAI",
    "DALL-E",
    "LinkedIn API",
    "Performance Analytics"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Intermediate",

},
{
  id: 16,
  title: "Gmail Spending History Extractor",
  description: "Extract spending history from Gmail receipts and organize it automatically in Google Sheets.",
  tags: ["Finance", "Email Parsing", "Data Organization"],
  downloads: 113,
  demoUrl: "#",
  integrations: ["Gmail API", "Google Sheets", "Regex Parsing"],
  jsonTemplate: gmailEmail,
  featured: false,
  overview: "This workflow automates the extraction of spending information from email receipts in Gmail. It identifies purchase receipts, extracts relevant data, and organizes it into a structured format in Google Sheets.\n\n1. Monitoring of Gmail for incoming receipts from various vendors.\n2. Extraction of purchase details including date, amount, vendor, and items.\n3. Categorization of expenses based on predefined rules.\n4. Organization of data into structured format in Google Sheets.\n5. Generation of spending reports and visualizations.\n6. Alerting for unusual spending patterns or budget overages.\n\nAutomate expense tracking by extracting data from email receipts.",
  useCase: "Simplify personal or business expense tracking, create organized spending records, and generate financial reports automatically.",
  setupInstructions: [
    {
      step: 1,
      title: "Set up Gmail API access",
      description: "Configure OAuth credentials for Gmail API access and message scanning."
    },
    {
      step: 2,
      title: "Configure Google Sheets integration",
      description: "Connect to Google Sheets for data organization and reporting."
    },
    {
      step: 3,
      title: "Define receipt patterns",
      description: "Configure patterns for identifying receipts from different vendors."
    },
    {
      step: 4,
      title: "Set up expense categories",
      description: "Define spending categories for automatic classification."
    }
  ],
  keyBenefits: [
    "Automated expense tracking",
    "Structured financial data",
    "Time-saving receipt processing",
    "Comprehensive spending reports"
  ],
  requirements: [
    "Gmail API Access",
    "Google Sheets Access",
    "Pattern Recognition"
  ],
  workflowNodes: [
    "Gmail Trigger",
    "Email Parsing",
    "Data Extraction",
    "Google Sheets",
    "Report Generation"
  ],
  setupTime: "20-30 minutes",
  difficulty: "Intermediate",
  videoTutorial: "https://drive.google.com/file/d/1AM3rq0ZK6nvxNbrOa7zIYZn93NLJtpTP/view?usp=sharing"

},


{
  id: 17,
  title: "Google Maps Lead Generation",
  description: "Automatically extract business leads from Google Maps based on location and industry filters.",
  tags: ["Lead Generation", "Data Scraping", "Sales"],
  downloads: 179,
  demoUrl: "#",
  integrations: ["Google Maps API", "CRM Integration", "Google Sheets"],
  jsonTemplate: googleMaps,
  featured: true,
  overview: "This workflow automates lead generation from Google Maps by extracting business information based on location, industry, and other filters. It gathers contact details, reviews, and other valuable data for sales prospecting.\n\n1. Define target criteria including location, industry, and business size.\n2. Automated scraping of business information from Google Maps.\n3. Data enrichment with additional details from various sources.\n4. Organization and filtering of leads based on quality scores.\n5. Export to CRM systems or Google Sheets for follow-up.\n6. Regular updates to keep lead information current.\n\nStreamline your sales prospecting with automated lead generation from Google Maps.",
  useCase: "Identify potential customers in specific locations and industries, build targeted prospect lists, and accelerate sales outreach with qualified leads.",
  setupInstructions: [
    {
      step: 1,
      title: "Set up Google Maps API",
      description: "Obtain and configure Google Maps API credentials for data extraction."
    },
    {
      step: 2,
      title: "Define target criteria",
      description: "Configure location, industry, and other filters for lead generation."
    },
    {
      step: 3,
      title: "Set up data storage",
      description: "Connect to Google Sheets or your CRM for storing extracted lead data."
    },
    {
      step: 4,
      title: "Test extraction process",
      description: "Run a test extraction to verify data quality and formatting."
    }
  ],
  keyBenefits: [
    "Automated lead discovery",
    "Targeted prospect lists",
    "Time-saving data collection",
    "Easy integration with CRM systems"
  ],
  requirements: [
    "Google Maps API Key",
    "Data Storage (Google Sheets or CRM)",
    "Location and Industry Criteria"
  ],
  workflowNodes: [
    "Schedule Trigger",
    "Google Maps API",
    "Data Processing",
    "Quality Filtering",
    "Data Export"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Intermediate"

},
{
  id: 18,
  title: "AI Image Captioning with Gemini",
  description: "Automatically generate accurate captions for images using Google's Gemini AI model.",
  tags: ["Image Processing", "AI Vision", "Accessibility"],
  downloads: 76,
  demoUrl: "#",
  integrations: ["Gemini API", "Image Storage", "CMS Integration"],
  jsonTemplate: imageCaps,
  featured: false,
  overview: "This workflow provides automated image captioning using Google's Gemini AI model. It analyzes images, generates descriptive and contextually appropriate captions, and integrates with various platforms for accessibility improvements.\n\n1. Image input from various sources (uploads, URLs, or connected platforms).\n2. Analysis of image content using Gemini AI vision capabilities.\n3. Generation of descriptive, accurate captions based on image content.\n4. Optional customization of caption style and length.\n5. Integration with content management systems for automatic captioning.\n6. Accessibility compliance reporting and improvements.\n\nEnhance accessibility and user experience with AI-powered image captioning.",
  useCase: "Improve website accessibility, automate social media image descriptions, and enhance content discoverability through accurate image captions.",
  setupInstructions: [
    {
      step: 1,
      title: "Set up Gemini API",
      description: "Obtain and configure Google Gemini API credentials for image analysis."
    },
    {
      step: 2,
      title: "Configure image sources",
      description: "Connect to image storage platforms or set up upload mechanisms."
    },
    {
      step: 3,
      title: "Define caption preferences",
      description: "Set style, length, and formatting preferences for generated captions."
    },
    {
      step: 4,
      title: "Test caption generation",
      description: "Upload test images to verify caption accuracy and quality."
    }
  ],
  keyBenefits: [
    "Improved accessibility compliance",
    "Automated image description",
    "Enhanced content discoverability",
    "Consistent caption quality"
  ],
  requirements: [
    "Gemini API Access",
    "Image Sources",
    "Content Management System"
  ],
  workflowNodes: [
    "Image Input",
    "Gemini API",
    "Caption Generation",
    "Quality Check",
    "CMS Integration"
  ],
  setupTime: "20-30 minutes",
  difficulty: "Intermediate ",
  videoTutorial: "https://drive.google.com/file/d/1OXMjSd-k84st97SAguec9C4_WtVqlqhY/view?usp=sharing"

  
  
},
{
  id: 19,
  title: "LinkedIn Lead Generation System",
  description: "Automate LinkedIn lead generation with targeted search and connection requests.",
  tags: ["LinkedIn", "Lead Generation", "Sales"],
  downloads: 167,
  demoUrl: "#",
  integrations: ["LinkedIn API", "CRM Integration", "Google Sheets"],
  jsonTemplate: linkLead,
  featured: true,
  overview: "This workflow automates lead generation on LinkedIn by identifying potential prospects based on criteria like industry, location, and job title. It facilitates connection requests and tracks engagement for sales follow-up.\n\n1. Definition of target prospect criteria and search parameters.\n2. Automated searching and filtering of LinkedIn profiles.\n3. Personalized connection request messaging based on profile information.\n4. Tracking of connection acceptance and response rates.\n5. Export of engaged prospects to CRM systems for follow-up.\n6. Performance analytics and optimization of outreach strategies.\n\nScale your LinkedIn networking with automated, targeted lead generation.",
  useCase: "Expand professional network, generate qualified B2B leads, and automate initial outreach on LinkedIn with personalized connection requests.",
  setupInstructions: [
    {
      step: 1,
      title: "Set up LinkedIn API",
      description: "Configure LinkedIn API access for profile searching and messaging."
    },
    {
      step: 2,
      title: "Define target criteria",
      description: "Set industry, location, job title, and other prospect filters."
    },
    {
      step: 3,
      title: "Create message templates",
      description: "Develop personalized connection request templates for different segments."
    },
    {
      step: 4,
      title: "Configure CRM integration",
      description: "Connect to your CRM system for lead tracking and follow-up."
    }
  ],
  keyBenefits: [
    "Automated prospect identification",
    "Personalized outreach at scale",
    "CRM integration for tracking",
    "Performance analytics"
  ],
  requirements: [
    "LinkedIn API Access",
    "CRM System",
    "Target Prospect Criteria"
  ],
  workflowNodes: [
    "Schedule Trigger",
    "LinkedIn API",
    "Profile Filtering",
    "Message Generation",
    "CRM Integration"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Advanced",
  videoTutorial: "https://drive.google.com/file/d/1OXMjSd-k84st97SAguec9C4_WtVqlqhY/view?usp=sharing"
},
{
  id: 20,
  title: "Long-Form Faceless Content Generator",
  description: "Create long-form faceless video content automatically with AI narration and visuals.",
  tags: ["Video Content", "AI Narration", "Content Creation"],
  downloads: 102,
  demoUrl: "#",
  integrations: ["Video APIs", "OpenAI", "Text-to-Speech"],
  jsonTemplate: longForm,
  featured: false,
  overview: "This workflow automates the creation of long-form faceless video content using AI narration and automatically generated visuals. It transforms text content into engaging videos without requiring on-camera presence.\n\n1. Input of text content or automatic generation of script based on topics.\n2. Conversion of text to natural-sounding AI narration.\n3. Automatic selection and sequencing of relevant visuals.\n4. Video composition with transitions, effects, and branding elements.\n5. Export to various platforms and formats.\n6. Performance tracking and content optimization.\n\nCreate engaging video content without appearing on camera using AI automation.",
  useCase: "Produce educational content, explainer videos, and social media content without filming yourself, maintaining consistent content output with minimal effort.",
  setupInstructions: [
    {
      step: 1,
      title: "Set up text-to-speech service",
      description: "Configure AI narration services for voice generation."
    },
    {
      step: 2,
      title: "Connect visual assets",
      description: "Set up access to stock libraries or upload custom visuals."
    },
    {
      step: 3,
      title: "Define content style",
      description: "Configure video length, style, and branding preferences."
    },
    {
      step: 4,
      title: "Test video generation",
      description: "Create sample videos to verify quality and formatting."
    }
  ],
  keyBenefits: [
    "No on-camera presence required",
    "Consistent content production",
    "Multilingual content capability",
    "Time-efficient video creation"
  ],
  requirements: [
    "Text-to-Speech API",
    "Visual Assets",
    "Video Editing API"
  ],
  workflowNodes: [
    "Content Input",
    "Text-to-Speech",
    "Visual Selection",
    "Video Composition",
    "Export Module"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Intermediate",
  videoTutorial: "https://drive.google.com/file/d/1OXMjSd-k84st97SAguec9C4_WtVqlqhY/view?usp=sharing"
},
{
  id: 21,
  title: "N8N Node Library",
  description: "Comprehensive library of custom nodes for extending n8n workflow automation capabilities.",
  tags: ["Development", "Workflow Automation", "Extensions"],
  downloads: 254,
  demoUrl: "#",
  integrations: ["n8n", "Custom APIs", "Webhooks"],
  jsonTemplate: n8node,
  featured: false,
  overview: "This workflow provides a library of custom nodes and extensions for enhancing n8n's built-in capabilities. It includes pre-built connectors, utilities, and specialized functions for complex automation scenarios.\n\n1. Collection of specialized nodes for various services and APIs.\n2. Utility functions for data manipulation and transformation.\n3. Custom triggers and actions for unique automation needs.\n4. Templates and examples for common use cases.\n5. Regular updates and community contributions.\n6. Documentation and support resources.\n\nExtend n8n's capabilities with a comprehensive library of custom nodes and utilities.",
  useCase: "Connect to specialized services, implement complex data transformations, and create custom automation logic beyond n8n's built-in capabilities.",
  setupInstructions: [
    {
      step: 1,
      title: "Install node library",
      description: "Add the custom node library to your n8n instance through the marketplace or manual installation."
    },
    {
      step: 2,
      title: "Configure node credentials",
      description: "Set up API keys and authentication for the custom nodes you plan to use."
    },
    {
      step: 3,
      title: "Explore node capabilities",
      description: "Review documentation and examples for each node's functionality."
    },
    {
      step: 4,
      title: "Implement in workflows",
      description: "Start incorporating custom nodes into your automation workflows."
    }
    //youtube sales
  ],
  keyBenefits: [
    "Extended integration capabilities",
    "Specialized automation functions",
    "Community-supported development",
    "Regular updates and improvements"
  ],
  requirements: [
    "n8n Instance",
    "API Credentials for Services",
    "Technical Understanding"
  ],
  workflowNodes: [
    "Custom Triggers",
    "Specialized Actions",
    "Data Transformations", 
    "API Connectors",
    "Utility Functions"
  ],
  setupTime: "20-30 minutes",
  difficulty: "Advanced",
videoTutorial: "https://drive.google.com/file/d/1wAXTCbCbHUho4MXORLWCT04o8dyOA2cY/view?usp=sharing"
},
{
  id: 22,
  title: "AI YouTube Trend Finder",
  description: "Use an AI Agent with a connected YouTube Search tool to discover trending videos and topics in your niche.",
  tags: ["YouTube", "AI Agent", "Content Research"],
  downloads: 118,
  demoUrl: "#",
  integrations: ["OpenAI", "YouTube API"],
  jsonTemplate: openais,
  featured: true,
  overview: "This workflow combines an **AI Agent** with a dedicated YouTube Search sub-workflow. The agent receives a niche from the user, queries YouTube up to 3 times, and returns structured insights on trending videos.\n\n1. User provides a content niche (e.g., 'crypto news').\n2. The AI Agent (powered by GPT) calls the `youtube_search` tool.\n3. The tool fetches recent YouTube videos using the API, filters by relevance and duration, and extracts stats.\n4. The AI Agent summarizes patterns, engagement metrics, and provides video/channel links.\n5. Creators receive actionable content insights based on emerging trends.",
  useCase: "Content creators and marketers can discover trending YouTube topics in their niche, identify high-engagement opportunities, and plan videos with greater reach potential.",
  setupInstructions: [
    {
      step: 1,
      title: "Configure API Keys",
      description: "Add your OpenAI and YouTube Data API credentials in n8n."
    },
    {
      step: 2,
      title: "Enable Memory + Agent",
      description: "Activate the AI Agent node with GPT model and Simple Memory for contextual conversation."
    },
    {
      step: 3,
      title: "Connect YouTube Search Tool",
      description: "Attach the `youtube_search` tool to the agent, linking it to the YouTube Search sub-workflow."
    },
    {
      step: 4,
      title: "Test the Trend Finder",
      description: "Run a query (e.g., 'AI startups') and confirm the AI returns video links, channel insights, and engagement stats."
    }
  ],
  keyBenefits: [
    "Hybrid AI + API-powered analysis",
    "Automated YouTube trend detection",
    "Context-aware insights via memory",
    "Structured video and channel data",
    "Faster content planning"
  ],
  requirements: [
    "OpenAI API Key",
    "YouTube API Key",
    "n8n instance"
  ],
  workflowNodes: [
    "Chat Trigger",
    "AI Agent (OpenAI GPT)",
    "Simple Memory",
    "youtube_search Tool",
    "YouTube API Query",
    "Video Stats Extraction",
    "Duration Filter",
    "Insights Aggregation",
    "Structured Results"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Intermediate",
  videoTutorial: "https://drive.google.com/file/d/1j7MEPDu01sTKd6f2BxySy9KdOUiYeU9F/view?usp=sharing"
},
{
  id: 23,
  title: "AI Resume Parser",
  description: "Automatically parse and extract key information from resumes for recruitment purposes.",
  tags: ["HR", "Recruitment", "Document Processing"],
  downloads: 189,
  demoUrl: "#",
  integrations: ["OpenAI", "ATS Integration", "Google Sheets"],
  jsonTemplate: resumeParser,
  featured: true,
  overview: "This workflow automates the extraction and analysis of information from resumes using AI. It parses various resume formats, extracts structured data, and integrates with applicant tracking systems for efficient recruitment.\n\n1. Upload or receive resumes in various formats (PDF, Word, etc.).\n2. AI-powered parsing of resume content and structure.\n3. Extraction of key information: contact details, education, experience, skills.\n4. Standardization and normalization of extracted data.\n5. Integration with ATS systems for candidate management.\n6. Reporting and analytics on candidate pipelines.\n\nStreamline recruitment with automated resume parsing and candidate data extraction.",
  useCase: "HR teams and recruiters can process high volumes of applications efficiently, reduce manual data entry, and improve candidate matching through structured data extraction.",
  setupInstructions: [
    {
      step: 1,
      title: "Set up document processing",
      description: "Configure resume upload mechanisms and format handling."
    },
    {
      step: 2,
      title: "Configure AI parsing",
      description: "Set up OpenAI or other AI services for resume analysis."
    },
    {
      step: 3,
      title: "Connect to ATS",
      description: "Integrate with your applicant tracking system for data transfer."
    },
    {
      step: 4,
      title: "Test with sample resumes",
      description: "Upload various resume formats to verify parsing accuracy."
    }
  ],
  keyBenefits: [
    "Reduced manual data entry",
    "Faster candidate processing",
    "Improved data accuracy",
    "ATS integration"
  ],
  requirements: [
    "Document Processing Capability",
    "AI Service Access",
    "ATS Integration"
  ],
  workflowNodes: [
    "Document Input",
    "AI Parsing",
    "Data Extraction",
    "Normalization",
    "ATS Integration"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Intermediate",
  videoTutorial: "https://drive.google.com/file/d/1T8wYdeKQQCHD_EcUwWXEdodLiABO6-bb/view?usp=sharing"
},
{
  id: 24,
  title: "AI Agent Token Usage Tracker",
  description: "Track AI agent token usage and estimate costs with automated Google Sheets reporting.",
  tags: ["Cost Management", "Analytics", "AI Monitoring"],
  downloads: 95,
  demoUrl: "#",
  integrations: ["OpenAI", "Google Sheets", "Custom APIs"],
  jsonTemplate: trackAi,
  featured: false,
  overview: "This workflow monitors and tracks token usage across AI agents and services, providing cost estimation and usage analytics. It helps organizations manage and optimize their AI spending effectively.\n\n1. Monitoring of API calls to various AI services.\n2. Tracking of token usage and associated costs.\n3. Budget alerts and usage threshold notifications.\n4. Detailed reporting and analytics in Google Sheets.\n5. Cost optimization recommendations.\n6. Historical trend analysis and forecasting.\n\nManage AI costs effectively with comprehensive token usage tracking and reporting.",
  useCase: "Organizations using multiple AI services can track spending, set usage budgets, receive cost alerts, and optimize their AI resource allocation.",
  setupInstructions: [
    {
      step: 1,
      title: "Connect AI services",
      description: "Configure API connections to the AI services you want to monitor."
    },
    {
      step: 2,
      title: "Set up Google Sheets",
      description: "Create and connect the reporting spreadsheet for data storage."
    },
    {
      step: 3,
      title: "Configure budget alerts",
      description: "Set usage thresholds and notification preferences."
    },
    {
      step: 4,
      title: "Test monitoring",
      description: "Generate test API calls to verify tracking accuracy."
    }
  ],
  keyBenefits: [
    "Cost visibility and control",
    "Usage optimization",
    "Budget management",
    "Detailed reporting"
  ],
  requirements: [
    "AI Service API Access",
    "Google Sheets Access",
    "Usage Monitoring"
  ],
  workflowNodes: [
    "API Monitoring",
    "Token Counting",
    "Cost Calculation",
    "Google Sheets",
    "Alert System"
  ],
  setupTime: "20-30 minutes",
  difficulty: "Intermediate",
  videoTutorial: "https://drive.google.com/file/d/1qw4RsT7lZB6Q_RHLmFX1jsEz7zyGVT2Y/view?usp=sharing"
},
{
  id: 25,
  title: "YouTube to Newsletter Converter",
  description: "Turn YouTube transcripts into newsletter drafts automatically using Dumpling AI and GPT-4o.",
  tags: ["Content Repurposing", "Newsletters", "AI Writing"],
  downloads: 83,
  demoUrl: "#",
  integrations: ["YouTube API", "OpenAI", "Email Platforms"],
  jsonTemplate: turnt,
  featured: false,
  overview: "This workflow automates the conversion of YouTube video content into newsletter format. It extracts transcripts, summarizes content, adapts it for written format, and prepares newsletter drafts for various platforms.\n\n1. Extraction of transcripts from YouTube videos.\n2. AI-powered summarization and adaptation for written format.\n3. Addition of contextual elements and calls-to-action.\n4. Formatting for email newsletter standards.\n5. Integration with email marketing platforms.\n6. Performance tracking of converted content.\n\nRepurpose video content into engaging newsletter material with AI conversion.",
  useCase: "Content creators and marketers can extend the reach of their video content by repurposing it into newsletter format, saving time on content creation while maintaining audience engagement.",
  setupInstructions: [
    {
      step: 1,
      title: "Set up YouTube API",
      description: "Configure access to YouTube Data API for transcript extraction."
    },
    {
      step: 2,
      title: "Configure AI services",
      description: "Set up Dumpling AI and GPT-4 for content adaptation."
    },
    {
      step: 3,
      title: "Connect email platform",
      description: "Integrate with your email marketing service for newsletter delivery."
    },
    {
      step: 4,
      title: "Test conversion process",
      description: "Convert sample videos to verify output quality and formatting."
    }
  ],
  keyBenefits: [
    "Content repurposing efficiency",
    "Cross-platform content distribution",
    "Time-saving automation",
    "Consistent messaging"
  ],
  requirements: [
    "YouTube API Access",
    "AI Service Access",
    "Email Platform Integration"
  ],
  workflowNodes: [
    "YouTube API",
    "Transcript Extraction",
    "Content Adaptation",
    "Formatting",
    "Email Integration"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Intermediate"
},
{
  id: 26,
  title: "Voice-Based Appointment Booking System",
  description: "Voice AI appointment booking system using ElevenLabs AI and Cal.com integration.",
  tags: ["Voice AI", "Appointment Scheduling", "Customer Service"],
  downloads: 127,
  demoUrl: "#",
  integrations: ["ElevenLabs API", "Cal.com", "Calendar APIs"],
  jsonTemplate: voiceb,
  featured: true,
  overview: "This workflow enables voice-based appointment booking using AI voice technology from ElevenLabs integrated with Cal.com scheduling. It provides a natural, conversational interface for customers to book appointments hands-free.\n\n1. Voice input processing through ElevenLabs speech recognition.\n2. Natural language understanding of appointment requests.\n3. Integration with Cal.com for availability checking and booking.\n4. Voice confirmation using AI-generated speech.\n5. Calendar synchronization and conflict detection.\n6. Follow-up notifications and reminders.\n\nTransform appointment booking with natural voice interactions and AI-powered scheduling.",
  useCase: "Businesses can offer convenient voice-based booking options, reduce phone staff requirements, and provide 24/7 appointment scheduling through AI voice assistants.",
  setupInstructions: [
    {
      step: 1,
      title: "Set up ElevenLabs API",
      description: "Configure ElevenLabs voice AI services for speech recognition and generation."
    },
    {
      step: 2,
      title: "Integrate with Cal.com",
      description: "Connect to Cal.com scheduling system for availability and booking management."
    },
    {
      step: 3,
      title: "Configure calendar integration",
      description: "Set up synchronization with calendar systems for conflict detection."
    },
    {
      step: 4,
      title: "Test voice booking",
      description: "Conduct test bookings to verify speech recognition and scheduling accuracy."
    }
  ],
  keyBenefits: [
    "Hands-free appointment booking",
    "24/7 availability",
    "Natural user experience",
    "Reduced staffing needs"
  ],
  requirements: [
    "ElevenLabs API Access",
    "Cal.com Integration",
    "Calendar System Access"
  ],
  workflowNodes: [
    "Voice Input",
    "Speech Recognition",
    "Scheduling Logic",
    "Calendar Integration",
    "Voice Response"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Advanced",
  videoTutorial: "https://drive.google.com/file/d/10ytuZtnjnVpfJvuk49an16YGcHg9eNqh/view?usp=sharing"
},
{
  id: 27,
  title: "Generate Auto-Post AI Videos",
  description: "Automatically create and schedule AI-generated videos for social media using Veo3 and Blotato.",
  tags: ["Video Generation", "Social Media", "AI Content"],
  downloads: 105,
  demoUrl: "#",
  integrations: ["Veo3 API", "Blotato", "Social Media APIs"],
  jsonTemplate: generateAuto,
  featured: false,
  overview: "This workflow automates the entire process of creating and posting AI-generated videos to social media platforms. It combines Veo3's video generation capabilities with Blotato's social media management for seamless content distribution.\n\n1. Content idea generation based on trends and audience preferences.\n2. Automated video creation using Veo3's AI capabilities.\n3. Optimization for different social media platforms and formats.\n4. Scheduling and posting through Blotato's social media management.\n5. Performance tracking and content optimization based on engagement metrics.\n6. Cross-platform distribution and synchronization.\n\nMaintain an active social media presence with automatically generated and posted video content.",
  useCase: "Social media managers and content creators can maintain consistent video posting schedules, experiment with content formats, and optimize engagement through automated video creation and distribution.",
  setupInstructions: [
    {
      step: 1,
      title: "Set up Veo3 API",
      description: "Configure Veo3 video generation services with your API credentials."
    },
    {
      step: 2,
      title: "Connect Blotato",
      description: "Integrate Blotato social media management with your social accounts."
    },
    {
      step: 3,
      title: "Define content strategy",
      description: "Set posting schedule, content themes, and platform preferences."
    },
    {
      step: 4,
      title: "Test automated posting",
      description: "Run a test cycle to verify video generation and posting functionality."
    }
  ],
  keyBenefits: [
    "Consistent video content production",
    "Multi-platform distribution",
    "Time-efficient content creation",
    "Performance-based optimization"
  ],
  requirements: [
    "Veo3 API Access",
    "Blotato Account",
    "Social Media Accounts"
  ],
  workflowNodes: [
    "Content Ideation",
    "Video Generation",
    "Platform Optimization",
    "Scheduling",
    "Performance Analytics"
  ],
  setupTime: "30-45 minutes",
  difficulty: "Intermediate",
  videoTutorial: "https://drive.google.com/file/d/1T8wYdeKQQCHD_EcUwWXEdodLiABO6-bb/view?usp=sharing"
},
{
  id: 28,
  title: "N8N Workflow Node Library",
  description: "Comprehensive collection of pre-built nodes and templates to accelerate n8n workflow development and automation.",
  tags: ["Development", "Workflow Templates", "Automation"],
  downloads: 287,
  demoUrl: "#",
  integrations: ["n8n", "Custom APIs", "Webhooks", "Various Services"],
  jsonTemplate: n8nwork,
  featured: true,
  overview: "This workflow provides an extensive library of pre-configured nodes and workflow templates designed to accelerate n8n automation development. It includes specialized connectors, utility functions, and complete workflow templates for common business processes.\n\n1. Collection of specialized nodes for various services beyond standard n8n offerings.\n2. Pre-built workflow templates for common automation scenarios across different industries.\n3. Utility nodes for complex data manipulation, transformation, and validation.\n4. Custom triggers and actions for unique business requirements.\n5. Regular updates with new integrations and functionality.\n6. Community-contributed nodes and templates with peer review system.\n\nAccelerate your n8n automation development with a comprehensive library of pre-built nodes and templates.",
  useCase: "Developers and automation specialists can quickly implement complex workflows, connect to specialized services, and leverage community-vetted solutions without building from scratch.",
  setupInstructions: [
    {
      step: 1,
      title: "Install node library package",
      description: "Add the N8N Node Library to your n8n instance through the integrated marketplace or manual installation process."
    },
    {
      step: 2,
      title: "Configure authentication",
      description: "Set up API credentials and authentication methods for the various services you plan to use from the library."
    },
    {
      step: 3,
      title: "Explore available nodes",
      description: "Browse the library documentation to understand available nodes, their parameters, and use cases."
    },
    {
      step: 4,
      title: "Import workflow templates",
      description: "Start with pre-built templates for common scenarios and customize them for your specific needs."
    },
    {
      step: 5,
      title: "Test functionality",
      description: "Thoroughly test each node and workflow in a development environment before deploying to production."
    }
  ],
  keyBenefits: [
    "Dramatically reduced development time",
    "Access to specialized integrations",
    "Community-vetted solutions",
    "Regular updates and new features",
    "Comprehensive documentation and examples"
  ],
  requirements: [
    "n8n instance (cloud or self-hosted)",
    "API credentials for target services",
    "Basic understanding of n8n workflow structure"
  ],
  workflowNodes: [
    "Custom API Connectors",
    "Data Transformation Utilities",
    "Specialized Triggers",
    "Template Workflows",
    "Error Handling Modules",
    "Logging and Monitoring"
  ],
  setupTime: "15-30 minutes",
  difficulty: "Beginner to Advanced",
  videoTutorial: "https://drive.google.com/file/d/1qw4RsT7lZB6Q_RHLmFX1jsEz7zyGVT2Y/view?usp=sharing"
}
];