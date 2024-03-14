import { PlusOutlined } from '@ant-design/icons';
import { Flex, Typography, Button, Table, Space, Card } from 'antd';
import { delay, useOrg } from '../../utils';
import { useState } from 'react';
import Search from '../shared/Search';
import { getOrg } from '../../store';
import { Id } from '../../api/models/shared';
import { showModal } from '../../shared/LightComponent';
import { message } from '../../App';

export default function FormOverview() {
  const orgId = useOrg();
  function refreshData(setState = false) {
    const result = getOrg(orgId).forms;
    if (setState) setForms(result);
    return result;
  }
  const [forms, setForms] = useState(refreshData);
  const [filtered, setFiltered] = useState(forms);
  function getHref(formId: Id, op: 'edit' | 'result'): string {
    return `/console/${op === 'edit' ? 'form/edit' : 'result'}?org=${orgId}&form=${formId}`;
  }
  return (<Card>
    <Flex vertical gap='small'>
      <Typography.Text>
        组织的每批纳新对应一个<Typography.Text strong>表单</Typography.Text>。
      </Typography.Text>
      <Flex wrap='wrap'>
        <Button icon={<PlusOutlined />} type='primary'
        >新增</Button>
      </Flex>
      <Search onChange={({ target: { value: search } }) => setFiltered(forms.filter(v => v.name.includes(search)))} />
      <Table title={(d) => `表单列表 (${d.length}项)`} rowKey='id' bordered columns={[{
        title: '名称',
        dataIndex: 'name'
      }, {
        title: '创建时间',
        render(value, record, index) {
          return new Date(record.createAt * 1000).stringify(true, true);
        },
      }, {
        title: '开放时间',
        render(value, record, index) {
          return new Date(record.startAt * 1000).stringify(true, true) + ' ~ ' + new Date(record.endAt * 1000).stringify(true, true);
        },
      }, {
        title: '操作',
        render(value, record, index) {
          return (<Space size={0}>
            <Button size='small' type='link'
              onClick={() => {
                localStorage.setItem('defaultForm', record.id.toString());
              }}
              href={getHref(record.id, 'edit')}>编辑</Button>
            <Button size='small' type='link'
              href={getHref(record.id, 'result')}>选拔</Button>
            <Button size='small' type='link'>复制</Button>
            <Button size='small' danger type='link'
              onClick={() => showModal({
                title: '删除表单',
                content: (<Flex vertical gap='small'><Typography.Text>
                  您确定要删除<Typography.Text underline strong>{record.name}</Typography.Text>吗？
                  <br />
                  删除表单也将删除其的候选人(包括<Typography.Text strong>已录取</Typography.Text>)与面试信息。
                </Typography.Text></Flex>),
                okButtonProps: { danger: true },
                async onConfirm() {
                  //TODO
                  await delay(500);
                  message.success("删除成功");
                }
              })}>删除</Button>
          </Space>);
        }
      }]} dataSource={filtered} pagination={{
        hideOnSinglePage: false,
        showSizeChanger: true,
        showQuickJumper: true
      }} expandable={{
        rowExpandable(record) { return false },
        expandIcon() { return <></> }
      }} />
    </Flex >
  </Card>);
}