import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Popconfirm,
  Tabs,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  BellOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { BorrowRecord, BorrowStatus, BorrowType, ApproveBorrowRequest, RejectBorrowRequest, ReturnBorrowRequest } from '@/services/types';
import { borrowApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import BorrowApply from './BorrowApply';

const { Title } = Typography;
const { TextArea } = Input;

const statusMap: Record<BorrowStatus, { text: string; color: string }> = {
  pending: { text: '待审批', color: 'orange' },
  approved: { text: '已批准', color: 'blue' },
  rejected: { text: '已拒绝', color: 'red' },
  returned: { text: '已归还', color: 'green' },
  overdue: { text: '逾期', color: 'red' },
  lost: { text: '丢失', color: 'default' },
};

const borrowTypeMap: Record<BorrowType, string> = {
  view: '查看',
  download: '下载',
  export: '导出',
};

interface FilterTab {
  key: string;
  label: string;
  status?: BorrowStatus;
}

const filterTabs: FilterTab[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审批', status: 'pending' },
  { key: 'approved', label: '已批准', status: 'approved' },
  { key: 'returned', label: '已归还', status: 'returned' },
  { key: 'overdue', label: '逾期', status: 'overdue' },
  { key: 'lost', label: '丢失', status: 'lost' },
];

const BorrowList = () => {
  const { user, isLibrarian } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BorrowRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState('all');
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BorrowRecord | null>(null);
  const [approveForm] = Form.useForm<ApproveBorrowRequest>();
  const [rejectForm] = Form.useForm<RejectBorrowRequest>();
  const [returnForm] = Form.useForm<ReturnBorrowRequest>();

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const currentTab = filterTabs.find(t => t.key === activeTab);
      let response;
      if (isLibrarian()) {
        response = await borrowApi.getBorrowList(page, pageSize, currentTab?.status);
      } else {
        response = await borrowApi.getMyBorrows(page, pageSize, currentTab?.status);
      }
      setData(response.items);
      setTotal(response.total);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '获取借阅列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, activeTab, user]);

  const handleApplySuccess = () => {
    setApplyModalVisible(false);
    message.success('借阅申请已提交');
    fetchData();
  };

  const handleApprove = async () => {
    if (!selectedRecord) return;
    try {
      const values = await approveForm.validateFields();
      await borrowApi.approveBorrow(selectedRecord.id, {
        borrowDate: values.borrowDate.format('YYYY-MM-DD'),
        dueDate: values.dueDate.format('YYYY-MM-DD'),
      });
      message.success('审批通过');
      setApproveModalVisible(false);
      approveForm.resetFields();
      fetchData();
    } catch (error) {
      if (error instanceof Error && error.name !== 'ValidateError') {
        message.error(error.message || '审批失败');
      }
    }
  };

  const handleReject = async () => {
    if (!selectedRecord) return;
    try {
      const values = await rejectForm.validateFields();
      await borrowApi.rejectBorrow(selectedRecord.id, values);
      message.success('已拒绝借阅申请');
      setRejectModalVisible(false);
      rejectForm.resetFields();
      fetchData();
    } catch (error) {
      if (error instanceof Error && error.name !== 'ValidateError') {
        message.error(error.message || '操作失败');
      }
    }
  };

  const handleReturn = async () => {
    if (!selectedRecord) return;
    try {
      const values = await returnForm.validateFields();
      await borrowApi.returnBorrow(selectedRecord.id, {
        returnDate: values.returnDate.format('YYYY-MM-DD'),
      });
      message.success('归还成功');
      setReturnModalVisible(false);
      returnForm.resetFields();
      fetchData();
    } catch (error) {
      if (error instanceof Error && error.name !== 'ValidateError') {
        message.error(error.message || '归还失败');
      }
    }
  };

  const handleMarkLost = async (record: BorrowRecord) => {
    try {
      await borrowApi.markAsLost(record.id);
      message.success('已标记为丢失');
      fetchData();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '操作失败');
    }
  };

  const handleRemind = async (record: BorrowRecord) => {
    try {
      await borrowApi.remindBorrow(record.id);
      message.success('催还通知已发送');
      fetchData();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '操作失败');
    }
  };

  const openApproveModal = (record: BorrowRecord) => {
    setSelectedRecord(record);
    approveForm.setFieldsValue({
      borrowDate: dayjs(),
      dueDate: dayjs().add(7, 'day'),
    });
    setApproveModalVisible(true);
  };

  const openRejectModal = (record: BorrowRecord) => {
    setSelectedRecord(record);
    setRejectModalVisible(true);
  };

  const openReturnModal = (record: BorrowRecord) => {
    setSelectedRecord(record);
    returnForm.setFieldsValue({
      returnDate: dayjs(),
    });
    setReturnModalVisible(true);
  };

  const columns: ColumnsType<BorrowRecord> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '文件名称',
      dataIndex: ['document', 'documentName'],
      key: 'documentName',
      ellipsis: true,
    },
    {
      title: '申请人',
      dataIndex: ['applicant', 'realName'],
      key: 'applicant',
      width: 100,
    },
    {
      title: '借阅类型',
      dataIndex: 'borrowType',
      key: 'borrowType',
      width: 100,
      render: (type: BorrowType) => borrowTypeMap[type],
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: BorrowStatus) => {
        const config = statusMap[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '借阅日期',
      dataIndex: 'borrowDate',
      key: 'borrowDate',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '预计归还',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '实际归还',
      dataIndex: 'returnDate',
      key: 'returnDate',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => {
        const isOwner = user?.id === record.applicantId;
        const canManage = isLibrarian();
        const actions = [];

        if (isOwner && record.status === 'approved') {
          actions.push(
            <Button key="return" type="link" size="small" icon={<RollbackOutlined />} onClick={() => openReturnModal(record)}>
              归还
            </Button>
          );
        }

        if (canManage && record.status === 'pending') {
          actions.push(
            <Button key="approve" type="link" size="small" icon={<CheckOutlined />} onClick={() => openApproveModal(record)}>
              审批
            </Button>
          );
          actions.push(
            <Button key="reject" type="link" size="small" danger icon={<CloseOutlined />} onClick={() => openRejectModal(record)}>
              拒绝
            </Button>
          );
        }

        if (canManage && (record.status === 'approved' || record.status === 'overdue')) {
          actions.push(
            <Button key="remind" type="link" size="small" icon={<BellOutlined />} onClick={() => handleRemind(record)}>
              催还
            </Button>
          );
        }

        if (canManage && record.status === 'approved') {
          actions.push(
            <Popconfirm
              key="lost"
              title="确定标记为丢失吗？"
              icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
              onConfirm={() => handleMarkLost(record)}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                标记丢失
              </Button>
            </Popconfirm>
          );
        }

        return <Space size="middle">{actions}</Space>;
      },
    },
  ];

  const tabItems = filterTabs.map(tab => ({
    key: tab.key,
    label: tab.label,
  }));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>借阅管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setApplyModalVisible(true)}>
          申请借阅
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条记录`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
        scroll={{ x: 1400 }}
      />

      <BorrowApply
        visible={applyModalVisible}
        onCancel={() => setApplyModalVisible(false)}
        onSuccess={handleApplySuccess}
      />

      <Modal
        title="审批借阅"
        open={approveModalVisible}
        onOk={handleApprove}
        onCancel={() => setApproveModalVisible(false)}
        destroyOnClose
      >
        <Form form={approveForm} layout="vertical">
          <Form.Item
            name={['borrowDate']}
            label="借阅日期"
            rules={[{ required: true, message: '请选择借阅日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name={['dueDate']}
            label="预计归还日期"
            rules={[{ required: true, message: '请选择预计归还日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="拒绝借阅"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => setRejectModalVisible(false)}
        destroyOnClose
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="rejectionReason"
            label="拒绝理由"
            rules={[{ required: true, message: '请填写拒绝理由' }]}
          >
            <TextArea rows={4} placeholder="请输入拒绝理由" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="归还确认"
        open={returnModalVisible}
        onOk={handleReturn}
        onCancel={() => setReturnModalVisible(false)}
        destroyOnClose
      >
        <Form form={returnForm} layout="vertical">
          <Form.Item
            name={['returnDate']}
            label="归还日期"
            rules={[{ required: true, message: '请选择归还日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BorrowList;
