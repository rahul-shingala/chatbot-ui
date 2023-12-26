import {
  IconCheck,
  IconCopy,
  IconEdit,
  IconRefresh,
  IconRobot,
  IconThumbDown,
  IconThumbUp,
  IconThumbUpOff,
  IconTrash,
  IconUser,
} from '@tabler/icons-react';
import { FC, memo, useContext, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { updateConversation } from '@/utils/app/conversation';

import { Message } from '@/types/chat';

import HomeContext from '@/pages/api/home/home.context';

import { CodeBlock } from '../Markdown/CodeBlock';
import { MemoizedReactMarkdown } from '../Markdown/MemoizedReactMarkdown';

import rehypeMathjax from 'rehype-mathjax';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import Image from 'next/image';
import { Button } from '../Button/Button';

export interface Props {
  message: Message;
  messageIndex: number;
  onEdit?: (editedMessage: Message) => void
}

export const ChatMessage: FC<Props> = memo(({ message, messageIndex, onEdit }) => {
  const { t } = useTranslation('chat');

  const {
    state: { selectedConversation, conversations, currentMessage, messageIsStreaming },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [messageContent, setMessageContent] = useState(message.content);
  const [messagedCopied, setMessageCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageContent(event.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleEditMessage = () => {
    if (message.content != messageContent) {
      if (selectedConversation && onEdit) {
        onEdit({ ...message, content: messageContent });
      }
    }
    setIsEditing(false);
  };

  const handleDeleteMessage = () => {
    if (!selectedConversation) return;

    const { messages } = selectedConversation;
    const findIndex = messages.findIndex((elm) => elm === message);

    if (findIndex < 0) return;

    if (
      findIndex < messages.length - 1 &&
      messages[findIndex + 1].role === 'assistant'
    ) {
      messages.splice(findIndex, 2);
    } else {
      messages.splice(findIndex, 1);
    }
    const updatedConversation = {
      ...selectedConversation,
      messages,
    };

    const { single, all } = updateConversation(
      updatedConversation,
      conversations,
    );
    homeDispatch({ field: 'selectedConversation', value: single });
    homeDispatch({ field: 'conversations', value: all });
  };

  const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !isTyping && !e.shiftKey) {
      e.preventDefault();
      handleEditMessage();
    }
  };

  const copyOnClick = () => {
    if (!navigator.clipboard) return;

    navigator.clipboard.writeText(message.content).then(() => {
      setMessageCopied(true);
      setTimeout(() => {
        setMessageCopied(false);
      }, 2000);
    });
  };

  useEffect(() => {
    setMessageContent(message.content);
  }, [message.content]);


  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);

  return (
    <div
      className={`listitem md:px-4 ${message.role === 'assistant'
          ? ' text-gray-800 dark:border-gray-900/50  dark:text-gray-100'
          : ' text-gray-800 dark:border-gray-900/50 dark:text-gray-100'
        }`}
      style={{ overflowWrap: 'anywhere' }}
    >
      <div className="group relative m-auto flex p-4 text-base md:max-w-2xl md:gap-4 md:py-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
        <div className="text-right font-bold">
          {message.role === 'assistant' ? (
            <div className='w-8 h-8 flex items-center justify-center bg-white rounded-full'>
              <Image src="/logo.png"
                alt="image"
                width={16}
                height={16}
              />
            </div>
          ) : (
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#b54604] text-white font-normal text-sm">P</div>
          )}
        </div>

        <div className="prose mt-[-2px] w-full dark:prose-invert">
          {message.role === 'user' ? (
            <div className='flex flex-col'>
              <h2 className='m-0 text-base text-white font-bold'>You</h2>
              <div className="flex flex-col gap-2 w-full">
                {isEditing ? (
                  <div className="flex w-full flex-col">
                    <textarea
                      ref={textareaRef}
                      className="w-full resize-none whitespace-pre-wrap border-none dark:bg-base focus:outline-none focus:border-[1px] focus:border-[rgba(255,255,255,0.12)]"
                      value={messageContent}
                      onChange={handleInputChange}
                      onKeyDown={handlePressEnter}
                      onCompositionStart={() => setIsTyping(true)}
                      onCompositionEnd={() => setIsTyping(false)}
                      style={{
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        lineHeight: 'inherit',
                        padding: '0',
                        margin: '0',
                        overflow: 'hidden',
                      }}
                    />

                    <div className="mt-4 flex justify-center space-x-4">
                      <Button 
                      size='small'
                      onClick={handleEditMessage}
                      disabled={messageContent.trim().length <= 0}
                      variant='primary' label="Save & Submit"></Button>
                      <button
                        className="h-[40px] rounded-md border border-neutral-300 px-4 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        onClick={() => {
                          setMessageContent(message.content);
                          setIsEditing(false);
                        }}
                      >
                        {t('Cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prose whitespace-pre-wrap dark:prose-invert flex-1">
                    {message.content}
                  </div>
                )}

                {!isEditing && (
                  <div className="md:-mr-8 ml-1 md:ml-0 flex flex-col md:flex-row gap-4 md:gap-1 items-center md:items-start justify-end md:justify-start">
                    <button
                      // className="invisible group-hover:visible focus:visible text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      className='invisible group-hover:visible cursor-pointer dark:text-white opacity-60 dark:hover:opacity-80'
                      onClick={toggleEditing}
                    >
                      <IconEdit size={18} />
                    </button>
                    <button
                      // className="invisible group-hover:visible focus:visible text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      className='invisible group-hover:visible cursor-pointer dark:text-white opacity-60 dark:hover:opacity-80'
                      onClick={handleDeleteMessage}
                    >
                      <IconTrash size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className='flex flex-col'>
              <h2 className='m-0 text-base text-white font-bold'>DhiWise</h2>
              <div className="flex flex-col gap-4">
                <MemoizedReactMarkdown
                  className="prose dark:prose-invert flex-1 markdown"
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeMathjax]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      if (children.length) {
                        if (children[0] == '▍') {
                          return <span className="animate-pulse cursor-default mt-1">▍</span>
                        }

                        children[0] = (children[0] as string).replace("`▍`", "▍")
                      }

                      const match = /language-(\w+)/.exec(className || '');

                      return !inline ? (
                        <CodeBlock
                          key={Math.random()}
                          language={(match && match[1]) || ''}
                          value={String(children).replace(/\n$/, '')}
                          {...props}
                        />
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    table({ children }) {
                      return (
                        <table className="border-collapse border border-black px-3 py-1 dark:border-white">
                          {children}
                        </table>
                      );
                    },
                    th({ children }) {
                      return (
                        <th className="break-words border border-black bg-gray-500 px-3 py-1 text-white dark:border-white">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td className="break-words border border-black px-3 py-1 dark:border-white">
                          {children}
                        </td>
                      );
                    },
                  }}
                >
                  {`${message.content}${messageIsStreaming && messageIndex == (selectedConversation?.messages.length ?? 0) - 1 ? '`▍`' : ''
                    }`}
                </MemoizedReactMarkdown>

                <div className="lastItemVisible invisible group-hover:visible md:-mr-8 ml-1 md:ml-0 flex flex-col md:flex-row gap-1 items-center md:items-start justify-end md:justify-start">
                  {messagedCopied ? (
                    <IconCheck
                      size={20}
                      className="text-green-500 dark:text-green-400"
                    />
                  ) : (
                    <button
                      className="cursor-pointer focus:visible text-gray-500 hover:text-gray-700 dark:text-white opacity-60 dark:hover:opacity-80"
                      onClick={copyOnClick}
                    >
                      <IconCopy size={20} />
                    </button>
                  )}
                  <div className='cursor-pointer dark:text-white opacity-60 dark:hover:opacity-80'>
                    <IconThumbUp size={20} />
                  </div>
                  <div className='cursor-pointer dark:text-white opacity-60 dark:hover:opacity-80'>
                    <IconThumbDown size={20} />
                  </div>
                  <div className=' cursor-pointer dark:text-white opacity-60 dark:hover:opacity-80'>
                    <IconRefresh size={20} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
ChatMessage.displayName = 'ChatMessage';
