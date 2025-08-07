"use client";

import React, { useState } from 'react';
import {
  DollarOutlined,
  CalculatorOutlined,
  PieChartOutlined,
  ShareAltOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Slider,
  Typography,
  Divider,
  Space,
  Tag,
  Alert,
  Row,
  Col,
  Statistic,
  Tooltip,
  Popover
} from 'antd';

const { Title, Text } = Typography;

const PricingCalculator = () => {
  const [form] = Form.useForm();
  const [results, setResults] = useState({
    monthlySavings: 0,
    recommendedRetainer: 0,
    netSavings: 0,
    roiPercentage: 0
  });

  const onFinish = (values: any) => {
    const { annualSavings, hoursPerWeek, roiMultiple } = values;
    const monthlySavings = annualSavings / 12;
    const recommendedRetainer = (monthlySavings * hoursPerWeek) / 160 * roiMultiple;
    const netSavings = monthlySavings - recommendedRetainer;
    const roiPercentage = (netSavings / recommendedRetainer) * 100;

    setResults({
      monthlySavings,
      recommendedRetainer,
      netSavings,
      roiPercentage
    });
  };

  const resetForm = () => {
    form.resetFields();
    setResults({
      monthlySavings: 0,
      recommendedRetainer: 0,
      netSavings: 0,
      roiPercentage: 0
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Title level={2} className="flex items-center justify-center">
          <CalculatorOutlined className="mr-2 text-blue-600" />
          AI Services Pricing Calculator
        </Title>
        <Text type="secondary" className="text-lg">
          Set data-driven pricing based on the ROI you deliver to clients
        </Text>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Title level={4} className="flex items-center mb-4">
            <DollarOutlined className="mr-2" />
            Custom Offer Inputs
          </Title>
          <Text type="secondary" className="block mb-4">
            Estimate how much you help your client save, pick the ROI multiple, and see your recommended monthly retainer
          </Text>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              annualSavings: 80000,
              hoursPerWeek: 20,
              roiMultiple: 5
            }}
          >
            <Form.Item
              name="annualSavings"
              label={
                <span>
                  Estimated Annual Savings for Client{' '}
                  <Tooltip title="How much money will your services save/make the client per year?">
                    <InfoCircleOutlined />
                  </Tooltip>
                </span>
              }
              rules={[{ required: true, message: 'Please input estimated savings!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                min={0}
              />
            </Form.Item>

            <Form.Item
              name="hoursPerWeek"
              label="Hours Worked Per Week"
              rules={[{ required: true, message: 'Please input hours!' }]}
            >
              <Slider
                min={5}
                max={40}
                marks={{
                  5: '5h',
                  20: '20h',
                  40: '40h'
                }}
              />
            </Form.Item>

            <Form.Item
              name="roiMultiple"
              label={
                <span>
                  ROI Multiple{' '}
                  <Tooltip title="How much of the value created should you capture? Typical range is 3-10x">
                    <InfoCircleOutlined />
                  </Tooltip>
                </span>
              }
              rules={[{ required: true, message: 'Please select ROI multiple!' }]}
            >
              <Slider
                min={1}
                max={10}
                marks={{
                  1: '1x',
                  5: '5x',
                  10: '10x'
                }}
              />
            </Form.Item>

            <div className="flex justify-between mt-8">
              <Button
                icon={<ReloadOutlined />}
                onClick={resetForm}
              >
                Reset to Defaults
              </Button>
              <Button
                type="primary"
                htmlType="submit"
              >
                Calculate Pricing
              </Button>
            </div>
          </Form>
        </Card>

        <Card>
          <Title level={4} className="flex items-center mb-4">
            <PieChartOutlined className="mr-2" />
            Your Custom Offer Pricing
          </Title>
          <Text type="secondary" className="block mb-4">
            Here's the recommended fee to maintain the desired ROI for your client
          </Text>

          <div className="space-y-6">
            <Statistic
              title="Monthly Cost Savings"
              value={results.monthlySavings}
              precision={2}
              prefix="$"
              className="mb-4"
            />

            <Divider />

            <Statistic
              title="Recommended Monthly Retainer"
              value={results.recommendedRetainer}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#3f8600' }}
              className="mb-4"
            />

            <Statistic
              title="Client's Net Savings (After Your Fee)"
              value={results.netSavings}
              precision={2}
              prefix="$"
              className="mb-4"
            />

            <Statistic
              title="Final ROI Percentage"
              value={results.roiPercentage}
              precision={0}
              suffix="%"
              valueStyle={{
                color: results.roiPercentage >= 100 ? '#3f8600' : '#cf1322'
              }}
            />

            {results.roiPercentage > 0 && results.roiPercentage < 100 && (
              <Alert
                message="Pricing Consideration"
                description="If ROI% is below 100%, you might need to raise your ROI multiple or reduce your fee."
                type="warning"
                showIcon
                className="mt-4"
              />
            )}

            {results.roiPercentage > 0 && (
              <div className="mt-6">
                <Popover
                  content={
                    <div className="p-2">
                      <Text strong>Pricing Breakdown:</Text>
                      <div className="mt-2">
                        <Text>
                          <strong>Monthly Savings:</strong> ${results.monthlySavings.toFixed(2)}
                        </Text>
                      </div>
                      <div>
                        <Text>
                          <strong>Your Fee:</strong> ${results.recommendedRetainer.toFixed(2)}
                        </Text>
                      </div>
                      <div>
                        <Text>
                          <strong>Client Net:</strong> ${results.netSavings.toFixed(2)}
                        </Text>
                      </div>
                      <Divider className="my-2" />
                      <Text>
                        ROI = (Net Savings / Your Fee) × 100 = {results.roiPercentage.toFixed(0)}%
                      </Text>
                    </div>
                  }
                  title="Calculation Details"
                  trigger="click"
                >
                  <Button type="dashed" block>
                    Show Calculation Details
                  </Button>
                </Popover>

                <Button
                  icon={<ShareAltOutlined />}
                  type="primary"
                  block
                  className="mt-2"
                >
                  Share Results with Client
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <Title level={4} className="mb-4">Pricing Strategy Guidance</Title>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Text strong>Value-Based Pricing</Text>
            <ul className="list-disc pl-5 mt-2">
              <li>Charge based on results delivered</li>
              <li>Higher ROI multiples for proven systems</li>
              <li>Ideal for measurable outcomes</li>
            </ul>
          </div>
          <div>
            <Text strong>Hourly Considerations</Text>
            <ul className="list-disc pl-5 mt-2">
              <li>20 hrs/week = ~80 hrs/month</li>
              <li>Adjust for your effective hourly rate</li>
              <li>Scale back hours as efficiency improves</li>
            </ul>
          </div>
          <div>
            <Text strong>ROI Multiples</Text>
            <ul className="list-disc pl-5 mt-2">
              <li>3-5x: Standard services</li>
              <li>5-7x: Specialized expertise</li>
              <li>7-10x: Guaranteed results</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PricingCalculator;