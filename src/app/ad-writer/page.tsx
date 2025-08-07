// app/ad-writer/page.tsx
"use client";

import React, { useState } from "react";
import { Card, Form, Input, Button, Typography, Steps, Progress, message, Tag, Divider } from "antd";
import { CopyOutlined, ThunderboltFilled, RocketOutlined, BulbOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const AdWriterPage = () => {
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [generatedAds, setGeneratedAds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const steps = [
    { title: "Brand DNA", icon: <BulbOutlined /> },
    { title: "Offer Blueprint", icon: <RocketOutlined /> },
    { title: "Audience Intel", icon: <ThunderboltFilled /> },
    { title: "Social Proof", icon: <CheckCircleOutlined /> },
    { title: "Launch Ads", icon: <CopyOutlined /> },
  ];

  const onFinish = async (values: any) => {
    setLoading(true);
    message.loading("Generating high-converting copy…", 1.5);
    // Simulate AI generation
    await new Promise((r) => setTimeout(r, 1500));
    const mockAds = [
      `🚨 ${values.businessName} – Stop bleeding ad spend!
      ${values.idealCustomer} are stuck ${values.biggestPain}. Our ${values.offerName} fixes it in ${values.timeframe}. ${values.cta} 👉 ${values.ctaUrl}`,
      `🎯 Case-study ad:
      “We took ${values.caseStudy1.split(".")[0]} from stuck to 3× revenue in 45 days using our ${values.uniqueMechanism}. Want the same? ${values.cta} ${values.ctaUrl}”`,
      `📈 Scroll-stopper:
      Still ${values.failedSolutions}? Our ${values.offerName} is the LAST system you’ll ever need. ${values.biggestBenefit}. ${values.cta} ${values.ctaUrl}`
    ];
    setGeneratedAds(mockAds);
    setCurrent(steps.length);
    setLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success("Copied to clipboard!");
  };

  const renderStepContent = () => {
    switch (current) {
      case 0:
        return (
          <Card>
            <Title level={4}>Brand DNA & Identity</Title>
            <Form.Item label="Business / Brand Name" name="businessName" rules={[{ required: true }]}>
              <Input placeholder="e.g., Quantum Growth Labs" />
            </Form.Item>
            <Form.Item label="Your Name & Title" name="personalBrand" rules={[{ required: true }]}>
              <Input placeholder="e.g., Alex Rivera, Founder & Chief Growth Hacker" />
            </Form.Item>
            <Form.Item label="1-Sentence Value Prop" name="valueProp" rules={[{ required: true }]}>
              <TextArea rows={2} placeholder="We help SaaS startups double MRR in 90 days with AI-driven growth loops." />
            </Form.Item>
          </Card>
        );
      case 1:
        return (
          <Card>
            <Title level={4}>Offer Blueprint</Title>
            <Form.Item label="Offer Name & Description" name="offerName" rules={[{ required: true }]}>
              <TextArea rows={2} placeholder="The 90-Day MRR Accelerator – an AI-powered coaching & implementation program…" />
            </Form.Item>
            <Form.Item label="Key Deliverables (comma-separated)" name="deliverables" rules={[{ required: true }]}>
              <Input placeholder="Weekly sprints, Growth OS templates, Slack support, Lifetime updates" />
            </Form.Item>
            <Form.Item label="Pricing" name="pricing" rules={[{ required: true }]}>
              <Input placeholder="$4,800 one-time or 3×$1,800" />
            </Form.Item>
            <Form.Item label="Unique Mechanism" name="uniqueMechanism" rules={[{ required: true }]}>
              <TextArea rows={2} placeholder="Our proprietary GrowthLoop AI analyzes 50+ retention signals in real time…" />
            </Form.Item>
          </Card>
        );
      case 2:
        return (
          <Card>
            <Title level={4}>Audience Intel</Title>
            <Form.Item label="Perfect Customer" name="idealCustomer" rules={[{ required: true }]}>
              <TextArea rows={2} placeholder="SaaS founders doing $20k–$200k MRR who can’t crack $50k MRR" />
            </Form.Item>
            <Form.Item label="Biggest Pain" name="biggestPain" rules={[{ required: true }]}>
              <TextArea rows={2} placeholder="burning cash on ads that don’t convert" />
            </Form.Item>
            <Form.Item label="Failed Solutions Tried" name="failedSolutions" rules={[{ required: true }]}>
              <Input placeholder="hiring expensive agencies, buying generic courses" />
            </Form.Item>
            <Form.Item label="Core Transformation" name="biggestBenefit" rules={[{ required: true }]}>
              <TextArea rows={2} placeholder="predictably hit $100k MRR" />
            </Form.Item>
            <Form.Item label="Time to Results" name="timeframe" rules={[{ required: true }]}>
              <Input placeholder="within 90 days" />
            </Form.Item>
          </Card>
        );
      case 3:
        return (
          <Card>
            <Title level={4}>Social Proof & Credibility</Title>
            <Form.Item label="Case Study #1" name="caseStudy1" rules={[{ required: true }]}>
              <TextArea rows={3} placeholder="Client: Acme SaaS – 2.3× MRR in 8 weeks using our AI retention engine…" />
            </Form.Item>
            <Form.Item label="Case Study #2" name="caseStudy2">
              <TextArea rows={3} placeholder="(optional) Client: BetaList – churn cut by 38% in 30 days…" />
            </Form.Item>
            <Form.Item label="Extra Credibility" name="credibility">
              <Input placeholder="250+ SaaS founders coached, avg 3.2× MRR lift" />
            </Form.Item>
          </Card>
        );
      case 4:
        return (
          <Card>
            <Title level={4}>Launch Triggers</Title>
            <Form.Item label="Primary CTA" name="cta" rules={[{ required: true }]}>
              <Input placeholder="Book Your Free Growth Audit" />
            </Form.Item>
            <Form.Item label="CTA URL" name="ctaUrl" rules={[{ required: true }]}>
              <Input placeholder="https://yoursite.com/audit" />
            </Form.Item>
            <Form.Item label="Urgency / Scarcity" name="urgency">
              <TextArea rows={2} placeholder="Only 7 spots left for July cohort – closes Friday midnight" />
            </Form.Item>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <Title level={2} className="flex items-center justify-center gap-2">
            <RocketOutlined className="text-indigo-500" />
            Ad Writer AI
          </Title>
          <Paragraph type="secondary">Answer a few prompts → Get scroll-stopping ad copy in seconds</Paragraph>
        </div>

        <Steps
          current={current}
          items={steps}
          className="mb-8"
          responsive
        />

        {current < steps.length && (
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            className="space-y-6"
          >
            {renderStepContent()}

            <div className="flex justify-between">
              <Button
                disabled={current === 0}
                onClick={() => setCurrent(current - 1)}
              >
                Back
              </Button>
              {current === steps.length - 1 ? (
                <Button type="primary" htmlType="submit" loading={loading}>
                  Generate Ads
                </Button>
              ) : (
                <Button type="primary" onClick={() => setCurrent(current + 1)}>
                  Next
                </Button>
              )}
            </div>
          </Form>
        )}

        {generatedAds.length > 0 && (
          <div className="mt-10 space-y-6">
            <Title level={3}>🎉 Your High-Converting Ad Copy</Title>
            {generatedAds.map((copy, idx) => (
              <Card key={idx} hoverable>
                <div className="flex justify-between items-start">
                  <SyntaxHighlighter
                    language="markdown"
                    style={tomorrow}
                    className="!bg-transparent !text-sm !m-0 !p-0 flex-1"
                  >
                    {copy}
                  </SyntaxHighlighter>
                  <Button
                    icon={<CopyOutlined />}
                    size="small"
                    onClick={() => copyToClipboard(copy)}
                  />
                </div>
              </Card>
            ))}
            <Button type="dashed" onClick={() => { setCurrent(0); setGeneratedAds([]); form.resetFields(); }}>
              Create Another Campaign
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdWriterPage;