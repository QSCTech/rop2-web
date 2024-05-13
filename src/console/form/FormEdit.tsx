import { createRef, forwardRef, useMemo, useRef, useState } from 'react';
import { basename, delay, moveElement, newUniqueLabel } from '../../utils';
import { Button, Collapse, DatePicker, Flex, FloatButton, Grid, Tabs, Tooltip, Typography } from 'antd';
import './FormEdit.scss';
import { QuestionGroup } from '../shared/useForm';
import { DescEditor, PreviewWithEditor } from './PreviewWithEditor';
import { ArrowRightOutlined, DeleteOutlined, EyeOutlined, LoginOutlined, PlusOutlined } from '@ant-design/icons';
import QuestionGroupSelect from './QuestionGroupSelect';
import { message } from '../../App';
import { showModal } from '../../shared/LightComponent';
import dayjs from 'dayjs';
import { useForm } from '../shared/useForm';
import { editForm } from '../../api/form';

export default function FormEdit() {
  const [form, , reload] = useForm('admin');
  const pageRef = useRef<HTMLDivElement>(null);
  const groups = form.children;
  const [curGroupIndex, setCurGroupIndex] = useState(-1);
  const refs = useMemo(() => groups.map(() => createRef<HTMLDivElement>()), [groups]);
  const { lg = false } = Grid.useBreakpoint();

  const editingTitle = useRef(form.name);//由于antd的可编辑文本特性，此处使用useRef而非useState
  return (
    <Flex className='editor'>
      <FloatButton tooltip='预览表单' type='primary' icon={<EyeOutlined />}
        onClick={() => window.open(`${basename}/apply/${form.id}?preview=1`, '_blank')} />
      <Flex className={'anchor' + (lg ? '' : ' hidden')}>
        <Tabs tabPosition='left'
          activeKey={groups[curGroupIndex]?.id?.toString() ?? 'header'}
          items={[{
            key: 'header',
            label: <div className='tab header'>表单抬头</div>
          }, ...form.children.map(group => {
            return {
              key: group.id.toString(),
              label: <div className='tab'>{group.label}</div>
            };
          })]}
          onTabClick={(key) => {
            if (key === 'header') {
              pageRef.current?.scrollTo({ top: 0 });
              setCurGroupIndex(-1);
            }
            else {
              const groupIndex = groups.findIndex(g => g.id.toString() === key)!;
              refs[groupIndex].current!.scrollIntoView();
              setCurGroupIndex(groupIndex);
            }
          }} />
      </Flex>
      <Flex className='page' vertical ref={pageRef}
        onScroll={() => {
          const scrollTop = pageRef.current!.scrollTop;
          const alignMargin = 1.2 * 14;//1.2em
          const curG = refs.findLastIndex(r => r.current!.offsetTop <= scrollTop + alignMargin) ?? -1;
          setCurGroupIndex(curG);
        }}>
        <Flex className='form' vertical gap='middle'>
          <Tooltip title={<>
            可随时修改开放时间和表单内容。
            <br />
            编辑表单内容会对已提交的答卷产生不确定的影响。
          </>}>
            <Flex vertical>
              <Typography.Text>设置开放时间</Typography.Text>
              <DatePicker.RangePicker showTime
                defaultValue={[form.startAt && dayjs(form.startAt), form.endAt && dayjs(form.endAt)]}
                allowEmpty={[true, true]}
                placeholder={['即刻起', '长期有效']}
                minDate={dayjs(new Date()).add(-3, 'day')}
                maxDate={dayjs(new Date()).add(3, 'month')}
                onChange={([start, end]) => {
                  //TODO formEdit API
                  //start end为null|dayjs，可用toJSON()
                }} />
            </Flex>
          </Tooltip>
          <Typography.Title level={3} editable={{
            onChange(v) { editingTitle.current = v; },
            async onEnd() {
              const newForm = { ...form, name: editingTitle.current };
              const prom = editForm(form.id, { name: editingTitle.current });
              reload(newForm, prom);
              await prom;
              message.success('标题已保存');
            }
          }} className='title'>{form.name}</Typography.Title>
          <DescEditor desc={form.desc} onConfirm={async (newDesc) => {
            const newForm = { ...form, desc: newDesc };
            const prom = editForm(form.id, { desc: newDesc });
            reload(newForm, prom);
            await prom;
            message.success('简介已保存');
          }} />

          {groups.map((group, index) => <GroupCard key={group.id}
            ref={refs[index]}
            isEntry={1 === group.id} group={group} groups={groups}
            onEdit={async (newObj) => {
              const newChildren = groups.with(index, newObj);
              const newForm = { ...form, children: newChildren };
              const prom = editForm(form.id, { children: JSON.stringify(newChildren) });
              reload(newForm, prom);
              await prom;
              message.success('修改已保存');
            }}
            onDelete={async () => await showModal({
              title: '删除问题组',
              content: <Typography.Text>
                您确定要删除问题组
                <Typography.Text strong>{group.label}</Typography.Text>
                吗？
                <br />
                删除问题组将删除其包含的所有题目(共 {group.children.length} 题)。
              </Typography.Text>,
              async onConfirm() {
                const newChildren = groups.toSpliced(index, 1);
                const newForm = { ...form, children: newChildren };
                const prom = editForm(form.id, { children: JSON.stringify(newChildren) });
                reload(newForm, prom);
                await prom;
                message.success('修改已保存');
              }
            })} />)}

          <Button type='default' icon={<PlusOutlined />}
            onClick={async () => {
              let maxGroupId = 0;
              groups.forEach(({ id }) => {
                if (id > maxGroupId) maxGroupId = id;
              })
              const newGroup: QuestionGroup = {
                id: maxGroupId + 1,
                children: [],
                label: newUniqueLabel(groups.map(gr => gr.label), '问题组')
              };
              const newChildren = [...groups, newGroup];
              const newForm = { ...form, children: newChildren };
              const prom = editForm(form.id, { children: JSON.stringify(newChildren) });
              reload(newForm, prom);
              await prom;
              message.success('修改已保存');
            }}>新增题目组</Button>
        </Flex>
      </Flex>
    </Flex >);
}

const GroupCard = forwardRef<HTMLDivElement,
  {
    group: QuestionGroup;
    groups: QuestionGroup[];
    isEntry: boolean;
    onEdit: (newObj: QuestionGroup) => Promise<void>;
    onDelete: () => Promise<boolean>;
  }
>(function ({ group, isEntry, groups, onEdit, onDelete }, ref) {
  const labelRef = useRef(group.label);
  const questions = group.children;
  return (<Collapse
    className='group'
    ref={ref}
    defaultActiveKey='default'
    collapsible='icon'
    items={[{
      key: 'default',
      label: (<Flex gap='small'
        //此监听用于防止Enter键直接折叠卡片
        //https://github.com/ant-design/ant-design/issues/42503
        onKeyDown={(ev) => ev.stopPropagation()}
      >
        {isEntry ? (<Tooltip trigger='hover'
          title={<>
            此为问卷的入口问题组。
            <br />
            所有候选人都必须完成该问题组。
          </>}>
          <LoginOutlined />
        </Tooltip>) : <></>}
        <Typography.Text editable={{
          onChange(v) { labelRef.current = v },
          async onEnd() {
            await onEdit({ ...group, label: labelRef.current });
          }
        }}>
          {group.label}
        </Typography.Text>
        <Button disabled={isEntry} type='link' size='small' icon={<DeleteOutlined />}
          onClick={async () => {
            if (await onDelete())
              message.success('删除题目组成功');
          }} />
      </Flex>),
      children: (<Flex vertical gap='small'>
        {questions.map((ques, index) => (
          <PreviewWithEditor key={ques.id}
            question={ques}
            groups={groups}
            thisGroup={group.id}
            onConfirm={async (newObj) => await onEdit({ ...group, children: questions.with(index, newObj) })}
            onDelete={async () => await onEdit({ ...group, children: questions.toSpliced(index, 1) })}
            onMove={async (delta) => await onEdit({ ...group, children: moveElement(questions, index, delta) })}
          />
        ))}
        <Flex wrap='wrap' align='center' gap='small'>
          <Button type='primary' icon={<PlusOutlined />}
            onClick={async () => {
              let maxId = 0;
              groups.forEach(gr =>
                gr.children.forEach(({ id }) => {
                  if (id > maxId) maxId = id;
                }));
              await onEdit({ ...group, children: [...questions, { type: 'text', title: '新问题', id: maxId + 1 }] });
            }}>新增问题</Button>
          <Tooltip title={<>
            指定须填写的下一个问题组。
            <br />
            相当于无条件的<strong>揭示</strong>另一问题组。
          </>}>
            <Flex gap='small'>
              <ArrowRightOutlined />
              下一问题组
            </Flex>
          </Tooltip>
          <QuestionGroupSelect
            value={group.next ?? null}
            groups={groups}
            thisGroup={group.id}
            onChange={(newGroup) => {
              onEdit({ ...group, next: newGroup ?? undefined })
            }} />
        </Flex>
      </Flex>)
    }]} />);
});