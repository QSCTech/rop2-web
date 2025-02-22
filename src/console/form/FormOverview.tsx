import { PlusOutlined } from '@ant-design/icons';
import { Flex, Typography, Button, Table, Space, Card } from 'antd';
import { basename } from '../../utils';
import { useContext, useState } from 'react';
import Search from '../shared/Search';
import { showModal, TempInput } from '../../shared/LightComponent';
import { message } from '../../App';
import dayjs from 'dayjs';
import { createForm, deleteForm } from '../../api/form';
import { FormListContext } from '../ConsoleLayout';

export default function FormOverview() {
  const [forms, loadingPromise, reload] = useContext(FormListContext);
  //注：此searchValue是用于前端搜索，不会传到后端
  const [searchValue, setSearchValue] = useState('');
  return (
    <Card>
      <Flex vertical gap="small">
        <Typography.Text>
          组织的每批纳新对应一个<Typography.Text strong>表单</Typography.Text>。
        </Typography.Text>
        <Flex wrap="wrap">
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => {
              const vref = { value: '' };
              showModal({
                title: '新建表单',
                content: (
                  <Flex vertical gap="small">
                    <Typography.Text>输入新表单的名称:</Typography.Text>
                    <TempInput vref={vref} showCount maxLength={100} />
                  </Flex>
                ),
                async onConfirm() {
                  const newName = vref.value.trim();
                  if (!newName) {
                    message.error('名称不能为空');
                    return;
                  }
                  const { code } = await createForm(newName);
                  if (!code) message.success('新建成功');
                  reload(forms);
                },
              });
            }}
          >
            新建
          </Button>
        </Flex>
        <Search onChangeTrimmed={(v) => setSearchValue(v)} />
        <Table
          title={(d) => `表单列表 (本页 ${d.length} 项 / 共 ${forms.length} 项)`}
          rowKey="id"
          bordered
          columns={[
            {
              title: '名称',
              dataIndex: 'name',
            },
            {
              title: '创建时间',
              render(value, record, index) {
                return dayjs(record.createAt).format('YYYY.MM.DD HH:mm:ss');
              },
            },
            {
              title: '开放时间',
              render(value, record, index) {
                const start = record.startAt ? dayjs(record.startAt).format('YYYY.MM.DD HH:mm:ss') : '即刻开始';
                const end = record.endAt ? dayjs(record.endAt).format('YYYY.MM.DD HH:mm:ss') : '长期有效';
                return start + ' ~ ' + end;
              },
            },
            {
              title: '操作',
              render(value, record, index) {
                const formId = record.id;
                //注：这里的href是antd的属性，与react-router无关，不会自动处理basename
                return (
                  <Space size={0}>
                    <Button size="small" type="link" href={`${basename}/console/form/edit/${formId}`}>
                      编辑
                    </Button>
                    <Button size="small" type="link" href={`${basename}/console/result/${formId}`}>
                      结果
                    </Button>
                    <Button size="small" type="link" href={`${basename}/apply/${formId}?preview=1`} target="_blank">
                      预览
                    </Button>
                    {/**<Button size='small' type='link'
              onClick={() => {'TODO: 复制表单' }}
            >复制</Button>*/}
                    <Button
                      size="small"
                      danger
                      type="link"
                      onClick={() =>
                        showModal({
                          title: '删除表单',
                          content: (
                            <Flex vertical gap="small">
                              <Typography.Text>
                                您确定要删除
                                <Typography.Text underline strong>
                                  {record.name}
                                </Typography.Text>
                                吗？
                                <br />
                                删除表单也将删除其的候选人(包括<Typography.Text strong>已录取</Typography.Text>)与面试信息。
                              </Typography.Text>
                            </Flex>
                          ),
                          okButtonProps: { danger: true },
                          async onConfirm() {
                            const { code } = await deleteForm(formId);
                            if (!code) message.success('删除成功');
                            reload(forms);
                          },
                        })
                      }
                    >
                      删除
                    </Button>
                  </Space>
                );
              },
            },
          ]}
          loading={!!loadingPromise}
          dataSource={forms.filter((f) => f.name.includes(searchValue))}
          pagination={{
            hideOnSinglePage: false,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          expandable={{
            rowExpandable() {
              return false;
            },
            expandIcon() {
              return <></>;
            },
          }}
        />
      </Flex>
    </Card>
  );
}
