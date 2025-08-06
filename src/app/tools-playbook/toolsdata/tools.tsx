// data/tools.ts
import { FileTextOutlined, BarChartOutlined, NotificationOutlined } from '@ant-design/icons';
import { ToolCategory} from './types'

export const toolCategories: ToolCategory[] = [
  {
    id: 'offer-positioning',
    name: 'Offer & Positioning',
    icon: <FileTextOutlined />,
    color: 'blue',
    tools: [
      {
        id: 'clarity-wizard',
        name: 'Clarity Wizard',
        description: 'Clarify your offer and positioning',
        inputs: [
          { name: 'productService', label: 'Product/Service Offered', type: 'text', required: true },
          { name: 'targetAudience', label: 'Who it\'s for', type: 'text', required: true },
          { name: 'problemSolved', label: 'Problem it solves', type: 'textarea', required: true },
          { name: 'deliveryMethod', label: 'Delivery method', type: 'select', options: ['Live', 'Done for you', 'SaaS'], required: true },
          { name: 'pricing', label: 'Pricing', type: 'text', required: true }
        ]
      },
      {
        id: 'value-stack-generator',
        name: 'Value Stack Generator',
        description: 'Create compelling value propositions',
        inputs: [
          { name: 'offerName', label: 'Offer name', type: 'text', required: true },
          { name: 'valueItems', label: 'Value line items', type: 'textarea', required: true },
          { name: 'finalPrice', label: 'Final bundled price', type: 'number', required: true }
        ]
      }
    ]
  },
  {
    id: 'market-research',
    name: 'Market Research',
    icon: <BarChartOutlined />,
    color: 'green',
    tools: [
      {
        id: 'market-scanner',
        name: 'Market Scanner',
        description: 'Scan market opportunities',
        inputs: [
          { name: 'industryNiche', label: 'Industry or niche', type: 'text', required: true },
          { name: 'offerType', label: 'Offer type', type: 'text', required: true }
        ]
      }
    ]
  },
  {
    id: 'acquisition-content',
    name: 'Acquisition Content',
    icon: <NotificationOutlined />,
    color: 'purple',
    tools: [
      {
        id: 'cold-email-writer',
        name: 'Cold Email Writer',
        description: 'Generate high-converting cold emails',
        inputs: [
          { name: 'offer', label: 'Offer', type: 'textarea', required: true },
          { name: 'tone', label: 'Tone', type: 'select', options: ['Professional', 'Casual'], required: true },
          { name: 'audience', label: 'Audience', type: 'text', required: true }
        ]
      }
    ]
  }
];