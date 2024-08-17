import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Checkbox, Flex, Form, Input, InputNumber, Select, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { ChoiceQuestion, CustomQuestion, Id, QuestionGroup, ValidQuestion } from '../shared/useForm';
import { FormQuestion } from '../../shared/FormQuestion';
import { newUniqueLabel } from '../../utils';
import QuestionGroupSelect from './QuestionGroupSelect';
import { message } from '../../App';
import { useOrg } from '../shared/useOrg';
import { DisabledContextProvider } from 'antd/es/config-provider/DisabledContext';

function QuestionEditor({ question, onChange, groups, thisGroup }:
  { question: ValidQuestion, onChange: (newObj: ValidQuestion) => void, groups: QuestionGroup[], thisGroup: Id }) {
  const [{ departs }] = useOrg();
  return (<Flex vertical className='editing' gap='small'>
    <Flex align='center' gap='small'>
      问题类型
      <Select showSearch={false}
        popupMatchSelectWidth={false}
        className='choice-type'
        value={question.type}
        defaultValue={question.type}
        onChange={(v) => {
          const newObj = { ...question, type: v };
          if (newObj.type === 'choice') {
            (newObj as any).choices = { '选项1': null, '选项2': null, '选项3': null };
            (newObj as any).maxSelection = 3;
          }
          else if (newObj.type === 'choice-depart') {
            (newObj as any).choices = {};
            departs.forEach(dep => (newObj as any).choices[dep.id] = null);
            (newObj as any).maxSelection = Math.min(3, departs.length);
          }
          (newObj as any).title ??= '问题标题';
          onChange(newObj as any);
        }}
        options={[/**{
          label: '姓名',
          value: 'name'
        }, {
          label: '学号',
          value: 'zjuid'
        }, {
          label: '手机号',
          value: 'phone'
        },*/ {
            label: '部门志愿选择',
            value: 'choice-depart'
          }, {
            label: '文本题',
            value: 'text'
          }, {
            label: '选择题',
            value: 'choice'
          }] satisfies {
            label: string;
            value: ValidQuestion['type'];
          }[]} />
    </Flex>
    {(() => {
      switch (question.type) {
        case 'choice-depart':
          //TODO: 根据useDeparts属性选择性启用志愿选择题
          return (<>
            <Flex align='center' gap='small'>
              <span className='prompt'>最多选择项数</span>
              <InputNumber maxLength={2} min={1} max={departs.length} value={question.maxSelection} onChange={(v) => onChange({ ...question, maxSelection: v ?? 1 })} />
            </Flex>
            <Flex wrap='wrap' gap='middle'>
              {departs.map((dep) => {
                //对于某一部门，如choices对象上不存在该键(undefined)，则隐藏该部门(不可选择)
                //如为null，表示可选择，不揭示任何问题组
                //否则，为揭示的问题组id
                let reveal = question.choices[dep.id];
                return (<Flex key={dep.id} gap='small' align='center'>
                  {dep.name}
                  <QuestionGroupSelect groups={groups} thisGroup={thisGroup}
                    value={reveal}
                    allowHide
                    onChange={(v) =>
                      onChange({ ...question, choices: { ...question.choices, [dep.id]: v } })} />
                </Flex>);
              })}
            </Flex>
          </>);
        case 'text':
          return (<>
            <CustomQuestionCommonEditor question={question} onChange={onChange} />
            <Flex align='center' gap='small'>
              <span className='prompt'>最大扩容行数</span>
              <InputNumber maxLength={1} min={1} max={8} value={question.maxLine ?? 1} onChange={(v) => onChange({ ...question, maxLine: v ?? 1 })} />
            </Flex>
          </>);
        case 'choice':
          return (<>
            <CustomQuestionCommonEditor question={question} onChange={onChange} />
            <ChoiceQuestionEditor groups={groups} thisGroup={thisGroup} question={question} onChange={onChange} />
          </>);
        default:
          return <>此问题类型暂不支持编辑 {JSON.stringify(question)}</>;
      }
    })()}
  </Flex>);
}

export function DescEditor({ desc, onConfirm }: { desc: string, onConfirm: (newDesc: string) => Promise<void> }) {
  const [editing, setEditing] = useState<string | undefined>(undefined);
  const isEditing = typeof editing === 'string';
  const hasDesc = desc.length > 0;
  return <Flex align={isEditing ? undefined : 'center'} gap='small' vertical={isEditing} >
    {isEditing
      ? <>
        <Input.TextArea
          autoSize={{ minRows: 3, maxRows: 5 }}
          value={editing}
          onChange={(ev) => { setEditing(ev.target.value) }} />
        <Flex gap='small' justify='flex-end'>
          <Button
            onClick={() => setEditing(undefined)}>
            取消
          </Button>
          <Button type='primary'
            onClick={async () => {
              setEditing(undefined);
              onConfirm(editing);
            }}>
            保存
          </Button>
        </Flex>
      </>
      : <>
        <Button style={{ flex: '0 0 auto' }}
          icon={<EditOutlined />} type='dashed'
          onClick={() => setEditing(desc)} />
        {hasDesc ? <Typography.Text>
          {desc}
        </Typography.Text> : <Typography.Text type='secondary'>编辑问卷简介</Typography.Text>}
      </>}
  </Flex>
}

export function PreviewWithEditor(
  { question, onConfirm, onDelete, groups, thisGroup, onMove, readOnly = false }: {
    question: ValidQuestion;
    onConfirm: (newObj: ValidQuestion) => Promise<void>;
    onDelete: () => Promise<void>;
    groups: QuestionGroup[];
    thisGroup: Id;
    onMove: (delta: number) => Promise<void>;
    readOnly?: boolean
  }) {
  const [editing, setEditing] = useState<ValidQuestion | undefined>(undefined);
  const isEditing = typeof editing === 'object';
  const group = useMemo(() => groups.find(g => g.id === thisGroup)!, [groups, thisGroup]);
  const quesIndex = group.children.indexOf(question);
  const isFirst = quesIndex == 0;
  const isLast = quesIndex == group.children.length - 1;
  const [{ departs }] = useOrg();
  return <>
    {isEditing
      ? <Flex vertical gap='small'>
        <QuestionEditor thisGroup={thisGroup} groups={groups} question={editing} onChange={(newObj) => setEditing(newObj)} />
        <Flex gap='small' justify='flex-end'>
          <Button
            onClick={() => setEditing(undefined)}>
            取消
          </Button>
          <Button type='primary'
            onClick={async () => {
              setEditing(undefined);
              await onConfirm(editing);
              // message.success('问题已保存');
            }}>
            保存
          </Button>
        </Flex>
      </Flex>
      : <Form layout='vertical'>
        <Flex align='center' gap='small' className='pre-editor'>
          <Flex className='ops' vertical={true}>
            <DisabledContextProvider disabled={readOnly}>
              <Button size='small'
                icon={<EditOutlined />} type='dashed'
                onClick={() => setEditing(question)} />
              <Button size='small'
                icon={<DeleteOutlined />} type='dashed'
                onClick={() => onDelete()} />
              {!isFirst && !readOnly ? <Button size='small'
                icon={<ArrowUpOutlined />} type='dashed'
                onClick={() => onMove(-1)} /> : <></>}
              {!isLast && !readOnly ? <Button size='small'
                icon={<ArrowDownOutlined />} type='dashed'
                onClick={() => onMove(1)} /> : <></>}
            </DisabledContextProvider>
          </Flex>
          <FormQuestion question={question} departs={departs} />
        </Flex>
      </Form>}
  </>
}

export function CustomQuestionCommonEditor({ question, onChange }:
  { question: ValidQuestion & CustomQuestion, onChange: (newObj: ValidQuestion & CustomQuestion) => void }) {
  return (<>
    <Flex align='center' gap='small'>
      <span className='prompt'>问题标题</span>
      <Input.TextArea value={question.title}
        autoSize={{ minRows: 1, maxRows: 3 }}
        onChange={({ target: { value } }) => onChange({ ...question, title: value })} />
    </Flex>
    <Flex align='center' gap='small'>
      <span className='prompt'>问题描述</span>
      <Input.TextArea value={question.desc}
        autoSize={{ minRows: 1, maxRows: 3 }}
        onChange={({ target: { value } }) => onChange({ ...question, desc: value })} />
    </Flex>
    <Flex align='center' gap='small'>
      <span className='prompt'>此题必填</span>
      <Checkbox checked={!question.optional} onChange={({ target: { checked } }) => onChange({ ...question, optional: checked ? undefined : true } as any)} />
    </Flex>
  </>);
}

export function ChoiceQuestionEditor({ question, onChange, groups, thisGroup }:
  { question: ChoiceQuestion, onChange: (newObj: ChoiceQuestion) => void, groups: QuestionGroup[], thisGroup: Id }) {
  const choices = question.choices;
  const entries = Object.entries(choices).filter(([, reveal]) => reveal !== undefined);
  return (<>
    <Flex align='center' gap='small'>
      <span className='prompt'>最多选择项数</span>
      <InputNumber maxLength={2} min={1} max={entries.length} value={question.maxSelection ?? entries.length} onChange={(v) => onChange({ ...question, maxSelection: v ?? 1 })} />
    </Flex>
    <Flex wrap='wrap' align='center' gap='small'>
      <Button size='small'
        onClick={() => onChange({
          ...question,
          choices: { ...choices, [newUniqueLabel(entries.map(([label]) => label), '选项')]: null }
        })}>
        <PlusOutlined />
        添加选项
      </Button>
    </Flex>
    <Flex wrap='wrap' align='center' gap='small'>
      {entries.map(([label, reveal], editingIndex) => {
        const editingValue = { value: '' };
        return (<Flex align='center' key={label}
          className='choice-card'>
          <Typography.Text
            editable={{
              onChange(v) { editingValue.value = v },
              onEnd() {
                if (entries.some(([oLabel]) => oLabel === editingValue.value))
                  message.error('选项名重复');
                else {
                  //保持选项位置不变
                  const newChoices: typeof choices = {};
                  entries[editingIndex] = [editingValue.value, reveal];
                  entries.forEach(([label, reveal]) => newChoices[label] = reveal);
                  onChange({ ...question, choices: newChoices });
                }
              }
            }}>{label}</Typography.Text>
          <Button type='link' size='small' onClick={() => {
            if (entries.length <= 1)
              message.error('至少保留1个选项');
            else {
              const newChoices: typeof choices = {};
              entries.forEach(([label, reveal], i) => {
                if (i !== editingIndex)
                  newChoices[label] = reveal
              });
              onChange({ ...question, choices: newChoices });
            }
          }}><DeleteOutlined /></Button>
          <QuestionGroupSelect groups={groups} thisGroup={thisGroup} value={reveal}
            title='选中此选项后揭示的题目组'
            size='small'
            onChange={(v) => onChange({ ...question, choices: Object.assign(choices, { [label]: v }) })} />
        </Flex>);
      })}
    </Flex>
  </>);
}