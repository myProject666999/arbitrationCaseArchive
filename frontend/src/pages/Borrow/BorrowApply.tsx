import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Tree,
  message,
  Row,
  Col,
  Typography,
  Card,
  Space,
} from 'antd';
import {
  FileOutlined,
  FolderOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import type { TreeDataNode } from 'antd';
import dayjs from 'dayjs';
import type { Case, Volume, Document, BorrowType, CreateBorrowRequest } from '@/services/types';
import { caseApi, volumeApi, documentApi, borrowApi } from '@/services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface BorrowApplyProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

interface TreeNodeData extends TreeDataNode {
  type: 'case' | 'volume' | 'document';
  data?: Case | Volume | Document;
  children?: TreeNodeData[];
}

const BorrowApply = ({ visible, onCancel, onSuccess }: BorrowApplyProps) => {
  const [form] = Form.useForm<CreateBorrowRequest>();
  const [loading, setLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const loadCases = async () => {
    setTreeLoading(true);
    try {
      const response = await caseApi.getCaseList(1, 1000);
      const treeNodes: TreeNodeData[] = response.items.map(caseItem => ({
        key: `case-${caseItem.id}`,
        title: caseItem.caseTitle,
        type: 'case',
        data: caseItem,
        isLeaf: false,
        icon: <InboxOutlined />,
      }));
      setTreeData(treeNodes);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载案件列表失败');
    } finally {
      setTreeLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadCases();
      form.resetFields();
      form.setFieldsValue({
        borrowDate: dayjs(),
        dueDate: dayjs().add(7, 'day'),
        borrowType: 'view',
      });
      setSelectedKeys([]);
      setSelectedDocument(null);
      setExpandedKeys([]);
    }
  }, [visible]);

  const loadVolumes = async (caseId: number): Promise<TreeNodeData[]> => {
    try {
      const volumes = await volumeApi.getVolumesByCase(caseId);
      return volumes.map(volume => ({
        key: `volume-${volume.id}`,
        title: volume.volumeName,
        type: 'volume',
        data: volume,
        isLeaf: false,
        icon: <FolderOutlined />,
      }));
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载卷册列表失败');
      return [];
    }
  };

  const loadDocuments = async (volumeId: number): Promise<TreeNodeData[]> => {
    try {
      const documents = await documentApi.getDocumentsByVolume(volumeId);
      return documents.map(doc => ({
        key: `document-${doc.id}`,
        title: doc.documentName,
        type: 'document',
        data: doc,
        isLeaf: true,
        icon: <FileOutlined />,
      }));
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载文件列表失败');
      return [];
    }
  };

  const handleTreeLoadData = async (treeNode: any) => {
    const { key, type } = treeNode.props;
    
    if (type === 'case') {
      const caseId = parseInt(key.split('-')[1]);
      const volumes = await loadVolumes(caseId);
      setTreeData(prev => {
        const updateTree = (nodes: TreeNodeData[]): TreeNodeData[] => {
          return nodes.map(node => {
            if (node.key === key) {
              return { ...node, children: volumes };
            }
            if (node.children) {
              return { ...node, children: updateTree(node.children) };
            }
            return node;
          });
        };
        return updateTree(prev);
      });
    } else if (type === 'volume') {
      const volumeId = parseInt(key.split('-')[1]);
      const documents = await loadDocuments(volumeId);
      setTreeData(prev => {
        const updateTree = (nodes: TreeNodeData[]): TreeNodeData[] => {
          return nodes.map(node => {
            if (node.key === key) {
              return { ...node, children: documents };
            }
            if (node.children) {
              return { ...node, children: updateTree(node.children) };
            }
            return node;
          });
        };
        return updateTree(prev);
      });
    }
  };

  const handleTreeSelect = (keys: React.Key[], info: any) => {
    setSelectedKeys(keys);
    if (keys.length > 0 && info.node.type === 'document') {
      const doc = info.node.data as Document;
      setSelectedDocument(doc);
      form.setFieldValue('documentId', doc.id);
    } else {
      setSelectedDocument(null);
      form.setFieldValue('documentId', undefined);
    }
  };

  const handleTreeExpand = (keys: React.Key[]) => {
    setExpandedKeys(keys);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      await borrowApi.applyBorrow({
        documentId: values.documentId,
        borrowType: values.borrowType,
        borrowReason: values.borrowReason,
        borrowDate: values.borrowDate.format('YYYY-MM-DD'),
        dueDate: values.dueDate.format('YYYY-MM-DD'),
      });
      
      onSuccess();
    } catch (error) {
      if (error instanceof Error && error.name !== 'ValidateError') {
        message.error(error.message || '申请失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const borrowTypeOptions: { value: BorrowType; label: string }[] = [
    { value: 'view', label: '查看' },
    { value: 'download', label: '下载' },
    { value: 'export', label: '导出' },
  ];

  return (
    <Modal
      title="申请借阅"
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={900}
      destroyOnClose
      okText="提交申请"
      cancelText="取消"
    >
      <Row gutter={16}>
        <Col span={12}>
          <Card 
            title="选择文件" 
            size="small" 
            style={{ height: 500 }}
            bodyStyle={{ height: 'calc(100% - 57px)', overflow: 'auto' }}
          >
            <Tree
              showIcon
              loadData={handleTreeLoadData}
              treeData={treeData}
              expandedKeys={expandedKeys}
              selectedKeys={selectedKeys}
              onExpand={handleTreeExpand}
              onSelect={handleTreeSelect}
              loading={treeLoading}
              blockNode
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="借阅信息" size="small" style={{ height: 500 }}>
            {selectedDocument ? (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Text strong>已选文件：</Text>
                  <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                    <Text>{selectedDocument.documentName}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      类型：{selectedDocument.documentType || '未知'} | 
                      大小：{selectedDocument.fileSize ? `${(selectedDocument.fileSize / 1024 / 1024).toFixed(2)} MB` : '未知'}
                    </Text>
                  </div>
                </div>

                <Form form={form} layout="vertical">
                  <Form.Item
                    name="documentId"
                    hidden
                    rules={[{ required: true, message: '请选择文件' }]}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="borrowType"
                    label="借阅类型"
                    rules={[{ required: true, message: '请选择借阅类型' }]}
                  >
                    <Select placeholder="请选择借阅类型">
                      {borrowTypeOptions.map(opt => (
                        <Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="borrowReason"
                    label="借阅理由"
                    rules={[{ required: true, message: '请填写借阅理由' }]}
                  >
                    <TextArea 
                      rows={3} 
                      placeholder="请详细说明借阅用途"
                      maxLength={500}
                      showCount
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name={['borrowDate']}
                        label="借阅日期"
                        rules={[{ required: true, message: '请选择借阅日期' }]}
                      >
                        <DatePicker style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name={['dueDate']}
                        label="预计归还日期"
                        rules={[{ required: true, message: '请选择预计归还日期' }]}
                      >
                        <DatePicker style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Space>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: 300,
                color: '#999'
              }}>
                <FileOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <Text type="secondary">请从左侧选择要借阅的文件</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Modal>
  );
};

export default BorrowApply;
