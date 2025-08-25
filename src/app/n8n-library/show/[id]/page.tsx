//app/n8n-library/show/[id]/page.tsx
"use client";

import { 
  DownloadOutlined,
  ArrowLeftOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { 
  Button, 
  Typography, 
  Tag, 
  Divider, 
  Row, 
  Col,
  Steps,
  Card,
  Space,
  Collapse
} from 'antd';
import { useRouter } from 'next/navigation';
import { useNavigation } from '@refinedev/core';

import { useParams } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;

// Import JSON templates
import whatsappChatbot from '../../jsons/whatsapp-ai-chatbot.json';
import weeklyReports from '../../jsons/weekly-marketing-report.json';
import youtubeCreator from '../../jsons/long-form-youtube-ai-gen.json';
import gmailAutoLabel from '../../jsons/gmail-auto-label-response.json';
import reviewResponse from '../../jsons/ai-review-response.json';
import salesCallAnalyzer from '../../jsons/ai-sales-call-analyzer.json';
import socialMediaGen from '../../jsons/ai-social-media-gen.json';
import autoLinkedinDm from '../../jsons/automated-linkedin-dm.json';

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

// Enhanced workflow data with detailed content
const workflowDetails: WorkflowDetailData[] = [
  {
    id: 1,
    title: "Automated LinkedIn DM System",
    description: "Use an N8N form to submit a text search to automagically connect with a target market on LinkedIn using AI personalized messages without any manual work (beyond the provided link). Automated LinkedIn outreach at scale.",
    tags: ["LinkedIn", "Outreach", "Automation"],
    downloads: 142,
    demoUrl: "#",
    integrations: ["LinkedIn API", "OpenAI", "Google Sheets"],
    jsonTemplate: autoLinkedinDm,
    featured: true,
    overview: "Use an N8N form to submit a text search to automagically connect with a target market on LinkedIn using AI personalized messages without any manual work beyond the provided search request).\n\n1. The text search is submitted into the N8N form\n2. Then the workflow uses Apollo via Apify to scrape the profiles in the search's list\n3. Which is then fed the profiles into an OpenAI step to generate the personalized message\n4. The workflow then outputs those personalized messages into a Google Sheet.\n5. PhantomBuster is then used to send connection requests with the personalized messages to the target profiles.\n\nAutomated LinkedIn outreach, solved.",
    useCase: "Save hours of individual profile research & personalization by automating LinkedIn connection requests and optimize the resulting reply & connection rates.",
    setupInstructions: [
      {
        step: 1,
        title: "Create an N8N account",
        description: "Create an N8N account at https://n8n.io"
      },
      {
        step: 2,
        title: "Create a new workflow",
        description: "Create a new workflow in N8N"
      },
      {
        step: 3,
        title: "Set-up auth for the OpenAI steps",
        description: "Set-up the OpenAI step by clicking into the step, setting up your OpenAI credentials (subscribe & get your OpenAI API key here: https://platform.openai.com/account/api-keys ), then setting the 'Authentication' dropdown to API Key, then create a new credential with the name 'OpenAI API Key'. Copy & paste the API key into the value field, it should look like this: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'"
      },
      {
        step: 4,
        title: "Set-up auth for the Apify step",
        description: "Set-up Apify by creating an account and creating an API key. You can find the API key in the Apify dashboard. You will need to add the API key to the workflow by clicking into the step, setting the 'Authentication' dropdown to 'Bearer Auth', then create a new credential with the name 'Apify API Key'. Copy & paste the API key into the value field, it should look like this: 'Bearer apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'",
        screenshot: "/screenshots/step4.png"
      },
      {
        step: 5,
        title: "Set-up OAuth & connect sheet for the Google Sheet step",
        description: "Connect via OAuth (recommended - you can use these docs: https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/?utm_source=n8n_app&utm_medium=credential_settings&utm_campaign=create_new_credentials_modal). You will need to create a new credential with the name 'Google Sheets OAuth2 API'. Copy & paste the API key into the value field, it should look like this: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'. Select the Google Sheet you want to connect to."
      },
      {
        step: 6,
        title: "Set-up auth for the PhantomBuster step",
        description: "Set-up PhantomBuster by creating an account and creating an API key. You can find the API key in the PhantomBuster dashboard. You will need to add the API key to the workflow by clicking into the step, then in 'Specify Headers', under 'Header Parameters > Value', paste in your API key. It should look like the previous keys you've dealt with so far.",
        screenshot: "/screenshots/step6.png"
      },
      {
        step: 7,
        title: "Test the workflow",
        description: "Click 'Test Workflow' at the bottom of the workflow editor. Write in a search query based on your own target audience, then click 'Submit'. Audit each step, make sure it works as expected.",
        screenshot: "/screenshots/step7.png"
      },
      {
        step: 8,
        title: "Optional: Modify the prompts inside the OpenAI steps",
        description: "The underlying prompts are set up to generate a search URL for the Apollo search, and then a personalized message for the outreach. You can modify these prompts to your liking to produce more attuned results for yourself and your clients.",
        screenshot: "/screenshots/step8.png"
      }
    ],
    keyBenefits: [
      "Increase lead conversion rates by up to 40%",
      "Save 10+ hours per week on manual outreach",
      "Personalized messaging based on lead behavior",
      "Grow your network and build relationships, fast"
    ],
    requirements: [
      "LinkedIn",
      "Open AI API Key",
      "Google Suite",
      "Phantombuster API Key"
    ],
    workflowNodes: [
      "N8N Form Trigger",
      "Apify",
      "OpenAI",
      "Google Sheets",
      "Phantombuster"
    ],
    setupTime: "30-45 minutes",
    difficulty: "Beginner",
    videoTutorial: "https://www.youtube.com/embed/example"
  },
    {
    id: 2,
    title: "AI Social Media Content Generator",
    description: "Use an N8N form to submit a text search to automagically connect with a target market on LinkedIn using AI personalized messages without any manual work (beyond the provided link). Automated LinkedIn outreach at scale.",
    tags: ["LinkedIn", "Outreach", "Automation"],
    downloads: 142,
    demoUrl: "#",
    integrations: ["LinkedIn API", "OpenAI", "Google Sheets"],
    jsonTemplate: autoLinkedinDm,
    featured: true,
    overview: "Use an N8N form to submit a text search to automagically connect with a target market on LinkedIn using AI personalized messages without any manual work beyond the provided search request).\n\n1. The text search is submitted into the N8N form\n2. Then the workflow uses Apollo via Apify to scrape the profiles in the search's list\n3. Which is then fed the profiles into an OpenAI step to generate the personalized message\n4. The workflow then outputs those personalized messages into a Google Sheet.\n5. PhantomBuster is then used to send connection requests with the personalized messages to the target profiles.\n\nAutomated LinkedIn outreach, solved.",
    useCase: "Save hours of individual profile research & personalization by automating LinkedIn connection requests and optimize the resulting reply & connection rates.",
    setupInstructions: [
      {
        step: 1,
        title: "Create an N8N account",
        description: "Create an N8N account at https://n8n.io"
      },
      {
        step: 2,
        title: "Create a new workflow",
        description: "Create a new workflow in N8N"
      },
      {
        step: 3,
        title: "Set-up auth for the OpenAI steps",
        description: "Set-up the OpenAI step by clicking into the step, setting up your OpenAI credentials (subscribe & get your OpenAI API key here: https://platform.openai.com/account/api-keys ), then setting the 'Authentication' dropdown to API Key, then create a new credential with the name 'OpenAI API Key'. Copy & paste the API key into the value field, it should look like this: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'"
      },
      {
        step: 4,
        title: "Set-up auth for the Apify step",
        description: "Set-up Apify by creating an account and creating an API key. You can find the API key in the Apify dashboard. You will need to add the API key to the workflow by clicking into the step, setting the 'Authentication' dropdown to 'Bearer Auth', then create a new credential with the name 'Apify API Key'. Copy & paste the API key into the value field, it should look like this: 'Bearer apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'",
        screenshot: "/screenshots/step4.png"
      },
      {
        step: 5,
        title: "Set-up OAuth & connect sheet for the Google Sheet step",
        description: "Connect via OAuth (recommended - you can use these docs: https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/?utm_source=n8n_app&utm_medium=credential_settings&utm_campaign=create_new_credentials_modal). You will need to create a new credential with the name 'Google Sheets OAuth2 API'. Copy & paste the API key into the value field, it should look like this: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'. Select the Google Sheet you want to connect to."
      },
      {
        step: 6,
        title: "Set-up auth for the PhantomBuster step",
        description: "Set-up PhantomBuster by creating an account and creating an API key. You can find the API key in the PhantomBuster dashboard. You will need to add the API key to the workflow by clicking into the step, then in 'Specify Headers', under 'Header Parameters > Value', paste in your API key. It should look like the previous keys you've dealt with so far.",
        screenshot: "/screenshots/step6.png"
      },
      {
        step: 7,
        title: "Test the workflow",
        description: "Click 'Test Workflow' at the bottom of the workflow editor. Write in a search query based on your own target audience, then click 'Submit'. Audit each step, make sure it works as expected.",
        screenshot: "/screenshots/step7.png"
      },
      {
        step: 8,
        title: "Optional: Modify the prompts inside the OpenAI steps",
        description: "The underlying prompts are set up to generate a search URL for the Apollo search, and then a personalized message for the outreach. You can modify these prompts to your liking to produce more attuned results for yourself and your clients.",
        screenshot: "/screenshots/step8.png"
      }
    ],
    keyBenefits: [
      "Increase lead conversion rates by up to 40%",
      "Save 10+ hours per week on manual outreach",
      "Personalized messaging based on lead behavior",
      "Grow your network and build relationships, fast"
    ],
    requirements: [
      "LinkedIn",
      "Open AI API Key",
      "Google Suite",
      "Phantombuster API Key"
    ],
    workflowNodes: [
      "N8N Form Trigger",
      "Apify",
      "OpenAI",
      "Google Sheets",
      "Phantombuster"
    ],
    setupTime: "30-45 minutes",
    difficulty: "Beginner",
    videoTutorial: "https://www.youtube.com/embed/example"
  },
   {
    id: 3,
    title: "AI Sales Call Analyzer",
    description: "Use an N8N form to submit a text search to automagically connect with a target market on LinkedIn using AI personalized messages without any manual work (beyond the provided link). Automated LinkedIn outreach at scale.",
    tags: ["LinkedIn", "Outreach", "Automation"],
    downloads: 142,
    demoUrl: "#",
    integrations: ["LinkedIn API", "OpenAI", "Google Sheets"],
    jsonTemplate: autoLinkedinDm,
    featured: true,
    overview: "Use an N8N form to submit a text search to automagically connect with a target market on LinkedIn using AI personalized messages without any manual work beyond the provided search request).\n\n1. The text search is submitted into the N8N form\n2. Then the workflow uses Apollo via Apify to scrape the profiles in the search's list\n3. Which is then fed the profiles into an OpenAI step to generate the personalized message\n4. The workflow then outputs those personalized messages into a Google Sheet.\n5. PhantomBuster is then used to send connection requests with the personalized messages to the target profiles.\n\nAutomated LinkedIn outreach, solved.",
    useCase: "Save hours of individual profile research & personalization by automating LinkedIn connection requests and optimize the resulting reply & connection rates.",
    setupInstructions: [
      {
        step: 1,
        title: "Create an N8N account",
        description: "Create an N8N account at https://n8n.io"
      },
      {
        step: 2,
        title: "Create a new workflow",
        description: "Create a new workflow in N8N"
      },
      {
        step: 3,
        title: "Set-up auth for the OpenAI steps",
        description: "Set-up the OpenAI step by clicking into the step, setting up your OpenAI credentials (subscribe & get your OpenAI API key here: https://platform.openai.com/account/api-keys ), then setting the 'Authentication' dropdown to API Key, then create a new credential with the name 'OpenAI API Key'. Copy & paste the API key into the value field, it should look like this: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'"
      },
      {
        step: 4,
        title: "Set-up auth for the Apify step",
        description: "Set-up Apify by creating an account and creating an API key. You can find the API key in the Apify dashboard. You will need to add the API key to the workflow by clicking into the step, setting the 'Authentication' dropdown to 'Bearer Auth', then create a new credential with the name 'Apify API Key'. Copy & paste the API key into the value field, it should look like this: 'Bearer apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'",
        screenshot: "/screenshots/step4.png"
      },
      {
        step: 5,
        title: "Set-up OAuth & connect sheet for the Google Sheet step",
        description: "Connect via OAuth (recommended - you can use these docs: https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/?utm_source=n8n_app&utm_medium=credential_settings&utm_campaign=create_new_credentials_modal). You will need to create a new credential with the name 'Google Sheets OAuth2 API'. Copy & paste the API key into the value field, it should look like this: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'. Select the Google Sheet you want to connect to."
      },
      {
        step: 6,
        title: "Set-up auth for the PhantomBuster step",
        description: "Set-up PhantomBuster by creating an account and creating an API key. You can find the API key in the PhantomBuster dashboard. You will need to add the API key to the workflow by clicking into the step, then in 'Specify Headers', under 'Header Parameters > Value', paste in your API key. It should look like the previous keys you've dealt with so far.",
        screenshot: "/screenshots/step6.png"
      },
      {
        step: 7,
        title: "Test the workflow",
        description: "Click 'Test Workflow' at the bottom of the workflow editor. Write in a search query based on your own target audience, then click 'Submit'. Audit each step, make sure it works as expected.",
        screenshot: "/screenshots/step7.png"
      },
      {
        step: 8,
        title: "Optional: Modify the prompts inside the OpenAI steps",
        description: "The underlying prompts are set up to generate a search URL for the Apollo search, and then a personalized message for the outreach. You can modify these prompts to your liking to produce more attuned results for yourself and your clients.",
        screenshot: "/screenshots/step8.png"
      }
    ],
    keyBenefits: [
      "Increase lead conversion rates by up to 40%",
      "Save 10+ hours per week on manual outreach",
      "Personalized messaging based on lead behavior",
      "Grow your network and build relationships, fast"
    ],
    requirements: [
      "LinkedIn",
      "Open AI API Key",
      "Google Suite",
      "Phantombuster API Key"
    ],
    workflowNodes: [
      "N8N Form Trigger",
      "Apify",
      "OpenAI",
      "Google Sheets",
      "Phantombuster"
    ],
    setupTime: "30-45 minutes",
    difficulty: "Beginner",
    videoTutorial: "https://www.youtube.com/embed/example"
  },
     {
    id: 4,
    title: "Weekly Marketing Reports",
    description: "Use an N8N form to submit a text search to automagically connect with a target market on LinkedIn using AI personalized messages without any manual work (beyond the provided link). Automated LinkedIn outreach at scale.",
    tags: ["LinkedIn", "Outreach", "Automation"],
    downloads: 142,
    demoUrl: "#",
    integrations: ["LinkedIn API", "OpenAI", "Google Sheets"],
    jsonTemplate: autoLinkedinDm,
    featured: true,
    overview: "Use an N8N form to submit a text search to automagically connect with a target market on LinkedIn using AI personalized messages without any manual work beyond the provided search request).\n\n1. The text search is submitted into the N8N form\n2. Then the workflow uses Apollo via Apify to scrape the profiles in the search's list\n3. Which is then fed the profiles into an OpenAI step to generate the personalized message\n4. The workflow then outputs those personalized messages into a Google Sheet.\n5. PhantomBuster is then used to send connection requests with the personalized messages to the target profiles.\n\nAutomated LinkedIn outreach, solved.",
    useCase: "Save hours of individual profile research & personalization by automating LinkedIn connection requests and optimize the resulting reply & connection rates.",
    setupInstructions: [
      {
        step: 1,
        title: "Create an N8N account",
        description: "Create an N8N account at https://n8n.io"
      },
      {
        step: 2,
        title: "Create a new workflow",
        description: "Create a new workflow in N8N"
      },
      {
        step: 3,
        title: "Set-up auth for the OpenAI steps",
        description: "Set-up the OpenAI step by clicking into the step, setting up your OpenAI credentials (subscribe & get your OpenAI API key here: https://platform.openai.com/account/api-keys ), then setting the 'Authentication' dropdown to API Key, then create a new credential with the name 'OpenAI API Key'. Copy & paste the API key into the value field, it should look like this: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'"
      },
      {
        step: 4,
        title: "Set-up auth for the Apify step",
        description: "Set-up Apify by creating an account and creating an API key. You can find the API key in the Apify dashboard. You will need to add the API key to the workflow by clicking into the step, setting the 'Authentication' dropdown to 'Bearer Auth', then create a new credential with the name 'Apify API Key'. Copy & paste the API key into the value field, it should look like this: 'Bearer apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'",
        screenshot: "/screenshots/step4.png"
      },
      {
        step: 5,
        title: "Set-up OAuth & connect sheet for the Google Sheet step",
        description: "Connect via OAuth (recommended - you can use these docs: https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/?utm_source=n8n_app&utm_medium=credential_settings&utm_campaign=create_new_credentials_modal). You will need to create a new credential with the name 'Google Sheets OAuth2 API'. Copy & paste the API key into the value field, it should look like this: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'. Select the Google Sheet you want to connect to."
      },
      {
        step: 6,
        title: "Set-up auth for the PhantomBuster step",
        description: "Set-up PhantomBuster by creating an account and creating an API key. You can find the API key in the PhantomBuster dashboard. You will need to add the API key to the workflow by clicking into the step, then in 'Specify Headers', under 'Header Parameters > Value', paste in your API key. It should look like the previous keys you've dealt with so far.",
        screenshot: "/screenshots/step6.png"
      },
      {
        step: 7,
        title: "Test the workflow",
        description: "Click 'Test Workflow' at the bottom of the workflow editor. Write in a search query based on your own target audience, then click 'Submit'. Audit each step, make sure it works as expected.",
        screenshot: "/screenshots/step7.png"
      },
      {
        step: 8,
        title: "Optional: Modify the prompts inside the OpenAI steps",
        description: "The underlying prompts are set up to generate a search URL for the Apollo search, and then a personalized message for the outreach. You can modify these prompts to your liking to produce more attuned results for yourself and your clients.",
        screenshot: "/screenshots/step8.png"
      }
    ],
    keyBenefits: [
      "Increase lead conversion rates by up to 40%",
      "Save 10+ hours per week on manual outreach",
      "Personalized messaging based on lead behavior",
      "Grow your network and build relationships, fast"
    ],
    requirements: [
      "LinkedIn",
      "Open AI API Key",
      "Google Suite",
      "Phantombuster API Key"
    ],
    workflowNodes: [
      "N8N Form Trigger",
      "Apify",
      "OpenAI",
      "Google Sheets",
      "Phantombuster"
    ],
    setupTime: "30-45 minutes",
    difficulty: "Beginner",
    videoTutorial: "https://www.youtube.com/embed/example"
  },
   {
    id: 5,
    title: "Whatsapp Sales AI Chatbot",
    description: "Use an N8N form to submit a text search to automagically connect with a target market on LinkedIn using AI personalized messages without any manual work (beyond the provided link). Automated LinkedIn outreach at scale.",
    tags: ["LinkedIn", "Outreach", "Automation"],
    downloads: 142,
    demoUrl: "#",
    integrations: ["LinkedIn API", "OpenAI", "Google Sheets"],
    jsonTemplate: autoLinkedinDm,
    featured: true,
    overview: "Use an N8N form to submit a text search to automagically connect with a target market on LinkedIn using AI personalized messages without any manual work beyond the provided search request).\n\n1. The text search is submitted into the N8N form\n2. Then the workflow uses Apollo via Apify to scrape the profiles in the search's list\n3. Which is then fed the profiles into an OpenAI step to generate the personalized message\n4. The workflow then outputs those personalized messages into a Google Sheet.\n5. PhantomBuster is then used to send connection requests with the personalized messages to the target profiles.\n\nAutomated LinkedIn outreach, solved.",
    useCase: "Save hours of individual profile research & personalization by automating LinkedIn connection requests and optimize the resulting reply & connection rates.",
    setupInstructions: [
      {
        step: 1,
        title: "Create an N8N account",
        description: "Create an N8N account at https://n8n.io"
      },
      {
        step: 2,
        title: "Create a new workflow",
        description: "Create a new workflow in N8N"
      },
      {
        step: 3,
        title: "Set-up auth for the OpenAI steps",
        description: "Set-up the OpenAI step by clicking into the step, setting up your OpenAI credentials (subscribe & get your OpenAI API key here: https://platform.openai.com/account/api-keys ), then setting the 'Authentication' dropdown to API Key, then create a new credential with the name 'OpenAI API Key'. Copy & paste the API key into the value field, it should look like this: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'"
      },
      {
        step: 4,
        title: "Set-up auth for the Apify step",
        description: "Set-up Apify by creating an account and creating an API key. You can find the API key in the Apify dashboard. You will need to add the API key to the workflow by clicking into the step, setting the 'Authentication' dropdown to 'Bearer Auth', then create a new credential with the name 'Apify API Key'. Copy & paste the API key into the value field, it should look like this: 'Bearer apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'",
        screenshot: "/screenshots/step4.png"
      },
      {
        step: 5,
        title: "Set-up OAuth & connect sheet for the Google Sheet step",
        description: "Connect via OAuth (recommended - you can use these docs: https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/?utm_source=n8n_app&utm_medium=credential_settings&utm_campaign=create_new_credentials_modal). You will need to create a new credential with the name 'Google Sheets OAuth2 API'. Copy & paste the API key into the value field, it should look like this: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'. Select the Google Sheet you want to connect to."
      },
      {
        step: 6,
        title: "Set-up auth for the PhantomBuster step",
        description: "Set-up PhantomBuster by creating an account and creating an API key. You can find the API key in the PhantomBuster dashboard. You will need to add the API key to the workflow by clicking into the step, then in 'Specify Headers', under 'Header Parameters > Value', paste in your API key. It should look like the previous keys you've dealt with so far.",
        screenshot: "/screenshots/step6.png"
      },
      {
        step: 7,
        title: "Test the workflow",
        description: "Click 'Test Workflow' at the bottom of the workflow editor. Write in a search query based on your own target audience, then click 'Submit'. Audit each step, make sure it works as expected.",
        screenshot: "/screenshots/step7.png"
      },
      {
        step: 8,
        title: "Optional: Modify the prompts inside the OpenAI steps",
        description: "The underlying prompts are set up to generate a search URL for the Apollo search, and then a personalized message for the outreach. You can modify these prompts to your liking to produce more attuned results for yourself and your clients.",
        screenshot: "/screenshots/step8.png"
      }
    ],
    keyBenefits: [
      "Increase lead conversion rates by up to 40%",
      "Save 10+ hours per week on manual outreach",
      "Personalized messaging based on lead behavior",
      "Grow your network and build relationships, fast"
    ],
    requirements: [
      "LinkedIn",
      "Open AI API Key",
      "Google Suite",
      "Phantombuster API Key"
    ],
    workflowNodes: [
      "N8N Form Trigger",
      "Apify",
      "OpenAI",
      "Google Sheets",
      "Phantombuster"
    ],
    setupTime: "30-45 minutes",
    difficulty: "Beginner",
    videoTutorial: "https://www.youtube.com/embed/example"
  },
   {
    id: 6,
    title: "Gmail Auto label and Response Drafter",
    description: "Use an N8N form to submit a text search to automagically connect with a target market on LinkedIn using AI personalized messages without any manual work (beyond the provided link). Automated LinkedIn outreach at scale.",
    tags: ["LinkedIn", "Outreach", "Automation"],
    downloads: 142,
    demoUrl: "#",
    integrations: ["LinkedIn API", "OpenAI", "Google Sheets"],
    jsonTemplate: autoLinkedinDm,
    featured: true,
    overview: "Use an N8N form to submit a text search to automagically connect with a target market on LinkedIn using AI personalized messages without any manual work beyond the provided search request).\n\n1. The text search is submitted into the N8N form\n2. Then the workflow uses Apollo via Apify to scrape the profiles in the search's list\n3. Which is then fed the profiles into an OpenAI step to generate the personalized message\n4. The workflow then outputs those personalized messages into a Google Sheet.\n5. PhantomBuster is then used to send connection requests with the personalized messages to the target profiles.\n\nAutomated LinkedIn outreach, solved.",
    useCase: "Save hours of individual profile research & personalization by automating LinkedIn connection requests and optimize the resulting reply & connection rates.",
    setupInstructions: [
      {
        step: 1,
        title: "Create an N8N account",
        description: "Create an N8N account at https://n8n.io"
      },
      {
        step: 2,
        title: "Create a new workflow",
        description: "Create a new workflow in N8N"
      },
      {
        step: 3,
        title: "Set-up auth for the OpenAI steps",
        description: "Set-up the OpenAI step by clicking into the step, setting up your OpenAI credentials (subscribe & get your OpenAI API key here: https://platform.openai.com/account/api-keys ), then setting the 'Authentication' dropdown to API Key, then create a new credential with the name 'OpenAI API Key'. Copy & paste the API key into the value field, it should look like this: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'"
      },
      {
        step: 4,
        title: "Set-up auth for the Apify step",
        description: "Set-up Apify by creating an account and creating an API key. You can find the API key in the Apify dashboard. You will need to add the API key to the workflow by clicking into the step, setting the 'Authentication' dropdown to 'Bearer Auth', then create a new credential with the name 'Apify API Key'. Copy & paste the API key into the value field, it should look like this: 'Bearer apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'",
        screenshot: "/screenshots/step4.png"
      },
      {
        step: 5,
        title: "Set-up OAuth & connect sheet for the Google Sheet step",
        description: "Connect via OAuth (recommended - you can use these docs: https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/?utm_source=n8n_app&utm_medium=credential_settings&utm_campaign=create_new_credentials_modal). You will need to create a new credential with the name 'Google Sheets OAuth2 API'. Copy & paste the API key into the value field, it should look like this: 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'. Select the Google Sheet you want to connect to."
      },
      {
        step: 6,
        title: "Set-up auth for the PhantomBuster step",
        description: "Set-up PhantomBuster by creating an account and creating an API key. You can find the API key in the PhantomBuster dashboard. You will need to add the API key to the workflow by clicking into the step, then in 'Specify Headers', under 'Header Parameters > Value', paste in your API key. It should look like the previous keys you've dealt with so far.",
        screenshot: "/screenshots/step6.png"
      },
      {
        step: 7,
        title: "Test the workflow",
        description: "Click 'Test Workflow' at the bottom of the workflow editor. Write in a search query based on your own target audience, then click 'Submit'. Audit each step, make sure it works as expected.",
        screenshot: "/screenshots/step7.png"
      },
      {
        step: 8,
        title: "Optional: Modify the prompts inside the OpenAI steps",
        description: "The underlying prompts are set up to generate a search URL for the Apollo search, and then a personalized message for the outreach. You can modify these prompts to your liking to produce more attuned results for yourself and your clients.",
        screenshot: "/screenshots/step8.png"
      }
    ],
    keyBenefits: [
      "Increase lead conversion rates by up to 40%",
      "Save 10+ hours per week on manual outreach",
      "Personalized messaging based on lead behavior",
      "Grow your network and build relationships, fast"
    ],
    requirements: [
      "LinkedIn",
      "Open AI API Key",
      "Google Suite",
      "Phantombuster API Key"
    ],
    workflowNodes: [
      "N8N Form Trigger",
      "Apify",
      "OpenAI",
      "Google Sheets",
      "Phantombuster"
    ],
    setupTime: "30-45 minutes",
    difficulty: "Beginner",
    videoTutorial: "https://www.youtube.com/embed/example"
  },
  // Add similar detailed data for other workflows...
];

const WorkflowDetail = () => {
  const router = useRouter();
    const params = useParams();
   const id = params.id as string;
  const { list } = useNavigation();
  
  const workflowId = id ? parseInt(id as string) : 1;
  const workflow = workflowDetails.find(w => w.id === workflowId) || workflowDetails[0];

  const downloadWorkflow = () => {
    const blob = new Blob([JSON.stringify(workflow.jsonTemplate, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.title.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
    <Button 
  type="text" 
  icon={<ArrowLeftOutlined />} 
  onClick={() => router.push('/n8n-library')}
  className="mb-4"
>
  Back to Library
</Button>

      <div className="rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Title level={2} className="mb-0">{workflow.title}</Title>
              {workflow.featured && (
                <Tag color="gold" icon={<ThunderboltOutlined />}>
                  Featured
                </Tag>
              )}
            </div>
            <Text type="secondary" className="text-lg">
              {workflow.description}
            </Text>
          </div>
          <Button 
            type="primary" 
            size="large" 
            icon={<DownloadOutlined />}
            onClick={downloadWorkflow}
          >
            Download Template
          </Button>
        </div>

        <Divider />

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Title level={3}>Overview</Title>
            <Paragraph>
              {workflow.overview.split('\n').map((paragraph, i) => (
                <span key={i}>
                  {paragraph}
                  <br /><br />
                </span>
              ))}
            </Paragraph>

            <Title level={3}>Use Case</Title>
            <Paragraph>{workflow.useCase}</Paragraph>

            {workflow.videoTutorial && (
              <>
                <Title level={3}>Video Tutorial</Title>
                <div className="aspect-video mb-6">
                  <iframe 
                    src={workflow.videoTutorial}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </>
            )}

            <Title level={3}>Key Benefits</Title>
            <ul className="pl-4 mb-6">
              {workflow.keyBenefits.map((benefit, i) => (
                <li key={i} className="mb-2">
                  <Text>{benefit}</Text>
                </li>
              ))}
            </ul>

            <Title level={3}>Setup Instructions</Title>
            <Steps direction="vertical" size="small" current={workflow.setupInstructions.length}>
              {workflow.setupInstructions.map(instruction => (
                <Step
                  key={instruction.step}
                  title={instruction.title}
                  description={
                    <div>
                      <Paragraph>{instruction.description}</Paragraph>
                      {instruction.screenshot && (
                        <div className="mt-2 p-2 border rounded-md">
                          <div className="text-sm text-gray-500 mb-1">Screenshot:</div>
                          <div className="bg-gray-100 h-40 flex items-center justify-center rounded">
                            <Text type="secondary">Screenshot placeholder</Text>
                          </div>
                        </div>
                      )}
                    </div>
                  }
                />
              ))}
            </Steps>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Workflow Details" className="mb-6">
              <Space direction="vertical" size="middle" className="w-full">
                <div>
                  <Text strong>Setup Time:</Text>
                  <br />
                  <Text>{workflow.setupTime}</Text>
                </div>
                
                <div>
                  <Text strong>Difficulty:</Text>
                  <br />
                  <Text>{workflow.difficulty}</Text>
                </div>
                
                <div>
                  <Text strong>Requirements:</Text>
                  <br />
                  <Space size={[0, 8]} wrap>
                    {workflow.requirements.map((req, i) => (
                      <Tag key={i}>{req}</Tag>
                    ))}
                  </Space>
                </div>
                
                <div>
                  <Text strong>Workflow Nodes:</Text>
                  <br />
                  <Space size={[0, 8]} wrap>
                    {workflow.workflowNodes.map((node, i) => (
                      <Tag key={i} color="blue">{node}</Tag>
                    ))}
                  </Space>
                </div>
                
                <div>
                  <Text strong>Integrations:</Text>
                  <br />
                  <Space size={[0, 8]} wrap>
                    {workflow.integrations.map((integration, i) => (
                      <Tag key={i} color="green">{integration}</Tag>
                    ))}
                  </Space>
                </div>
                
                <div>
                  <Text strong>Tags:</Text>
                  <br />
                  <Space size={[0, 8]} wrap>
                    {workflow.tags.map((tag, i) => (
                      <Tag key={i}>{tag}</Tag>
                    ))}
                  </Space>
                </div>
              </Space>
            </Card>

            <Button 
              type="primary" 
              size="large" 
              icon={<DownloadOutlined />}
              onClick={downloadWorkflow}
              block
            >
              Download Template
            </Button>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default WorkflowDetail;