import { Button, Flex, Input, Space, Table, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Depart } from '../../api/models/org';
import { delay, toArray, useOrg } from '../../utils';
import { msg } from '../../App';
import LoadableModal from '../shared/LoadableModal';
import { DetailDrawer } from '../shared/DetailDrawer';
import { getOrg } from '../../store';

export default function DepartManage() {
  const orgId = useOrg();
  function refreshData(setState = false) {
    const result = getOrg(orgId);
    if (setState) {
      setOrg(result);
      setDeparts(result.children);
    }
    return result;
  }
  const [org, setOrg] = useState(() => refreshData(false));
  const [departs, setDeparts] = useState(org.children);
  const [op, setOp] = useState<undefined
    | 'detail' | 'rename' | 'delete' | 'new'>(undefined);
  function clearOp() { setOp(undefined) }
  const [obj, setObj] = useState<undefined | Depart>(undefined);
  let items = undefined;
  if (op === 'detail' && obj)
    items = [{
      label: 'ID',
      children: obj.id,
      span: 1
    }, {
      label: '创建时间',
      children: new Date(obj.createdAt * 1000).stringify(),
      span: 2
    }, {
      label: '名称',
      children: obj.name,
      span: 3
    }, {
      label: '归属组织',
      children: org.name,
      span: 3
    }];
  return (<Flex vertical gap='small'>
    <Typography.Text>
      组织可以下设一个或多个<Typography.Text strong>部门</Typography.Text>。
      <br />
      所有组织创建时都具有一个特殊的<Typography.Text strong>默认部门</Typography.Text>，绑定至该部门的信息(如面试、用户)将在整个组织共享。
    </Typography.Text>
    <Flex wrap='wrap'>
      <Button icon={<PlusOutlined />} type='primary'
        onClick={() => setOp('new')}>新增</Button>
    </Flex>
    <Table title={(d) => `部门列表 (${d.length}项)`} rowKey='id' bordered
      columns={[{
        title: '名称',
        render(value, record, index) {
          return <Typography.Text italic={org.defaultDepart === record.id}>{record.name}</Typography.Text>
        },
      }, {
        title: '操作',
        render(value, record, index) {
          return (<Space size={0}>
            <Button size='small' type='link'
              onClick={() => {
                setObj(record);
                setOp('detail');
              }}>详情</Button>
            <Button size='small' type='link'
              onClick={() => {
                setObj(record);
                setOp('rename');
              }}>重命名</Button>
            <Button size='small' danger type='link'
              onClick={() => {
                setObj(record);
                setOp('delete');
              }}>删除</Button>
          </Space>);
        },
      }]}
      dataSource={departs}
      pagination={false}
      expandable={{
        rowExpandable(record) { return false },
        expandIcon() { return <></> }
      }} />
    <DetailDrawer
      onClose={clearOp}
      items={items} />
    <NameModal
      onCancel={clearOp}
      onConfirm={async (newName) => {
        //TODO 重命名/新建部门
        if (op === 'new') { }
        else { }
        await delay(2000);
        clearOp();
        refreshData(true);
      }}
      name={op === 'rename' ? obj?.name : undefined}
      newItem={op === 'new'}
    />
    <DeleteModal
      onCancel={clearOp}
      onConfirm={async () => {
        //TODO 删除部门
        await delay(2000);
        clearOp();
        refreshData(true);
      }}
      name={op === 'delete' ? obj?.name : undefined} />
  </Flex >);
}

function NameModal({ name, onConfirm, onCancel, newItem: newItem }: { name: string | undefined, onConfirm: (newName: string) => Promise<void>, onCancel: () => void, newItem: boolean }) {
  const [newName, setNewName] = useState('');
  const show = Boolean(name || newItem);
  if (!show && newName)
    setNewName('');
  const opName = newItem ? '新建' : '重命名';
  return (<LoadableModal open={show} title={`${opName}部门`}
    okButtonProps={{ disabled: !newName }}
    onCancel={onCancel} onOk={() =>
      onConfirm(newName).then(() => { msg.success(`${opName}成功`) })}>
    <Typography.Text>
      为<Typography.Text underline strong>{name ?? '新建部门'}</Typography.Text>指定新名称(须在组织内唯一):
    </Typography.Text>
    <Input value={newName} onChange={(ev) => setNewName((ev.target.value))} showCount maxLength={16} />
  </LoadableModal>);
}

function DeleteModal({ name, onCancel, onConfirm }: { name: string | undefined, onCancel: () => void, onConfirm: () => Promise<void> }) {
  return (<LoadableModal open={Boolean(name)} title='删除部门'
    okButtonProps={{ danger: true }} onCancel={onCancel} onOk={() => onConfirm().then(() => { msg.success('删除成功') })}>
    <Typography.Text>
      您确定要删除<Typography.Text underline strong>{name}</Typography.Text>吗？
    </Typography.Text>
  </LoadableModal>);
}