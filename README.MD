# ArbitrageOS - Complete Platform Dashboard

A comprehensive operating system for client management, tools & playbook, agents & workflows, and resource management.

## 🚀 Features

### Dashboard
- **Welcome Panel**: Dynamic greeting and orientation suggestions
- **Quick Start Actions**: Create clients, launch tools, run workflows, deploy agents
- **Activity Feed**: Timestamped log of all actions across clients
- **Recent Deliverables**: Preview panel of most recent tool outputs
- **Running Automations**: Table view of all currently active agents and workflows
- **Stats Overview**: Key metrics and performance indicators

### Client Profiles
- **All Clients**: Grid/list view with filters and search
- **Create New Profile**: Comprehensive client information management
- **Client Overview**: Detailed client information with timeline feed
- **Stages**: Idea, Prelaunch, Active, Scaling
- **Tags & Services**: Flexible categorization system

### Tools & Playbook
- **Offer & Positioning**: Clarity Wizard, Value Stack Generator, Audience Refiner
- **Market Research**: Top Niches, Market Scanner, Competitor Profiler, Trend Pulse
- **Acquisition Content**: Cold Email Writer, Hook & Ad Generator, Script Engine, UGC Brief Wizard
- **Deliverables & Strategy**: Growth Plan Builder, Funnel Snapshot Writer, Weekly Recap Generator
- **Client Selector**: Link tools to specific clients
- **Input/Output Panels**: Structured tool execution interface

### Agents & Workflows
- **Template Library**: Pre-built automation templates (N8N, Zapier, Make.com)
- **Active Agents**: Directory of deployed automation agents
- **My Workflows**: Custom workflow management
- **Deployment**: Purchase and deploy automation templates
- **Status Monitoring**: Real-time status tracking

### Resources
- **Output Library**: All outputs generated across the platform
- **Deliverables by Client**: Client-specific content management
- **Template Library**: Reusable content templates
- **File Vault**: Document and asset management
- **Search & Filter**: Advanced filtering capabilities

### Settings
- **Integrations**: Connect to external platforms (N8N, Zapier, Gmail, Slack, Notion, Make.com)
- **Team Access**: User management with role-based permissions
- **API Key Management**: Secure integration setup

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Heroicons
- **Routing**: React Router DOM
- **Date Handling**: date-fns
- **Forms**: React Hook Form

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ArbitrageOS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🏗️ Project Structure

```
src/
├── components/
│   └── Layout.tsx              # Main layout with sidebar
├── pages/
│   ├── Dashboard.tsx           # Main dashboard page
│   ├── ClientProfiles.tsx      # Client management
│   ├── ToolsPlaybook.tsx       # Tools and playbook
│   ├── AgentsWorkflows.tsx     # Automation management
│   ├── Resources.tsx           # Resource management
│   └── Settings.tsx            # Settings and integrations
├── store/
│   └── index.ts                # Zustand state management
├── App.tsx                     # Main app component
├── index.tsx                   # App entry point
└── index.css                   # Global styles
```

## 🎨 Design System

### Colors
- **Primary**: Blue (#0ea5e9)
- **Secondary**: Gray (#64748b)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#ef4444)

### Components
- **Cards**: Consistent card layout with hover effects
- **Buttons**: Primary and secondary button styles
- **Forms**: Standardized input fields and form layouts
- **Tables**: Responsive table designs
- **Modals**: Overlay modals for detailed interactions

## 🔧 Configuration

### Tailwind CSS
The project uses Tailwind CSS with custom configuration for colors and typography. See `tailwind.config.js` for details.

### State Management
Zustand is used for global state management with the following stores:
- Clients
- Tools
- Agents
- Workflows
- Deliverables
- UI State

## 📱 Responsive Design

The dashboard is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🔌 Integrations

The platform supports integration with:
- **N8N**: Workflow automation
- **Zapier**: App integration
- **Gmail**: Email services
- **Slack**: Team communication
- **Notion**: Documentation
- **Make.com**: Visual automation

## 🚀 Getting Started

1. **Create Your First Client**
   - Navigate to Client Profiles
   - Click "Create New Client"
   - Fill in business information

2. **Run Your First Tool**
   - Go to Tools & Playbook
   - Select a tool category
   - Launch a tool and provide inputs

3. **Deploy an Automation**
   - Visit Agents & Workflows
   - Browse template library
   - Purchase and deploy a template

4. **Manage Resources**
   - Access the Resources section
   - View outputs and deliverables
   - Upload and manage files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**ArbitrageOS** - Scaling client operations through intelligent automation and strategic tools. 