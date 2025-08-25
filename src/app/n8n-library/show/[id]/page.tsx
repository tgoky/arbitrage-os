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

import {workflowDetails} from '../../libs/libs'

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