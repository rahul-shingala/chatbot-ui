import { IconCaretDown, IconClearAll, IconPlus, IconSettings, IconUser } from '@tabler/icons-react';
import {
  MutableRefObject,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';

import { useTranslation } from 'next-i18next';

import { getEndpoint } from '@/utils/app/api';
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation';
import { throttle } from '@/utils/data/throttle';

import { ChatBody, Conversation, Message } from '@/types/chat';
import { Plugin } from '@/types/plugin';

import HomeContext from '@/pages/api/home/home.context';

import Spinner from '../Spinner';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { ErrorMessageDiv } from './ErrorMessageDiv';
import { ModelSelect } from './ModelSelect';
import { SystemPrompt } from './SystemPrompt';
import { TemperatureSlider } from './Temperature';
import { MemoizedChatMessage } from './MemoizedChatMessage';
import Image from 'next/image';
import Input from '../Input/Input';
import SelectBox from '../Select/Select';
import Link from 'next/link';
import { Button } from '../Button/Button';

interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}

export const Chat = memo(({ stopConversationRef }: Props) => {
  const { t } = useTranslation('chat');

  const {
    state: {
      selectedConversation,
      conversations,
      models,
      apiKey,
      pluginKeys,
      serverSideApiKeyIsSet,
      messageIsStreaming,
      modelError,
      loading,
      prompts,
    },
    handleUpdateConversation,
    dispatch: homeDispatch,
    handleNewConversation,
  } = useContext(HomeContext);

  const [currentMessage, setCurrentMessage] = useState<Message>();
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showScrollDownButton, setShowScrollDownButton] =
    useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(
    async (message: Message, deleteCount = 0, plugin: Plugin | null = null) => {
      if (selectedConversation) {
        let updatedConversation: Conversation;
        if (deleteCount) {
          const updatedMessages = [...selectedConversation.messages];
          for (let i = 0; i < deleteCount; i++) {
            updatedMessages.pop();
          }
          updatedConversation = {
            ...selectedConversation,
            messages: [...updatedMessages, message],
          };
        } else {
          updatedConversation = {
            ...selectedConversation,
            messages: [...selectedConversation.messages, message],
          };
        }
        homeDispatch({
          field: 'selectedConversation',
          value: updatedConversation,
        });
        homeDispatch({ field: 'loading', value: true });
        homeDispatch({ field: 'messageIsStreaming', value: true });
        const chatBody: ChatBody = {
          model: updatedConversation.model,
          messages: updatedConversation.messages,
          key: apiKey,
          prompt: updatedConversation.prompt,
          temperature: updatedConversation.temperature,
        };
        const endpoint = getEndpoint(plugin);
        let body;
        if (!plugin) {
          body = JSON.stringify(chatBody);
        } else {
          body = JSON.stringify({
            ...chatBody,
            googleAPIKey: pluginKeys
              .find((key) => key.pluginId === 'google-search')
              ?.requiredKeys.find((key) => key.key === 'GOOGLE_API_KEY')?.value,
            googleCSEId: pluginKeys
              .find((key) => key.pluginId === 'google-search')
              ?.requiredKeys.find((key) => key.key === 'GOOGLE_CSE_ID')?.value,
          });
        }
        const controller = new AbortController();
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body,
        });
        if (!response.ok) {
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          toast.error(response.statusText);
          return;
        }
        const data = response.body;
        if (!data) {
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          return;
        }
        if (!plugin) {
          if (updatedConversation.messages.length === 1) {
            const { content } = message;
            const customName =
              content.length > 30 ? content.substring(0, 30) + '...' : content;
            updatedConversation = {
              ...updatedConversation,
              name: customName,
            };
          }
          homeDispatch({ field: 'loading', value: false });
          const reader = data.getReader();
          const decoder = new TextDecoder();
          let done = false;
          let isFirst = true;
          let text = '';
          while (!done) {
            if (stopConversationRef.current === true) {
              controller.abort();
              done = true;
              break;
            }
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            const chunkValue = decoder.decode(value);
            text += chunkValue;
            if (isFirst) {
              isFirst = false;
              const updatedMessages: Message[] = [
                ...updatedConversation.messages,
                { role: 'assistant', content: chunkValue },
              ];
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              };
              homeDispatch({
                field: 'selectedConversation',
                value: updatedConversation,
              });
            } else {
              const updatedMessages: Message[] =
                updatedConversation.messages.map((message, index) => {
                  if (index === updatedConversation.messages.length - 1) {
                    return {
                      ...message,
                      content: text,
                    };
                  }
                  return message;
                });
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              };
              homeDispatch({
                field: 'selectedConversation',
                value: updatedConversation,
              });
            }
          }
          saveConversation(updatedConversation);
          const updatedConversations: Conversation[] = conversations.map(
            (conversation) => {
              if (conversation.id === selectedConversation.id) {
                return updatedConversation;
              }
              return conversation;
            },
          );
          if (updatedConversations.length === 0) {
            updatedConversations.push(updatedConversation);
          }
          homeDispatch({ field: 'conversations', value: updatedConversations });
          saveConversations(updatedConversations);
          homeDispatch({ field: 'messageIsStreaming', value: false });
        } else {
          const { answer } = await response.json();
          const updatedMessages: Message[] = [
            ...updatedConversation.messages,
            { role: 'assistant', content: answer },
          ];
          updatedConversation = {
            ...updatedConversation,
            messages: updatedMessages,
          };
          homeDispatch({
            field: 'selectedConversation',
            value: updateConversation,
          });
          saveConversation(updatedConversation);
          const updatedConversations: Conversation[] = conversations.map(
            (conversation) => {
              if (conversation.id === selectedConversation.id) {
                return updatedConversation;
              }
              return conversation;
            },
          );
          if (updatedConversations.length === 0) {
            updatedConversations.push(updatedConversation);
          }
          homeDispatch({ field: 'conversations', value: updatedConversations });
          saveConversations(updatedConversations);
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
        }
      }
    },
    [
      apiKey,
      conversations,
      pluginKeys,
      selectedConversation,
      stopConversationRef,
    ],
  );

  const scrollToBottom = useCallback(() => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      textareaRef.current?.focus();
    }
  }, [autoScrollEnabled]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const bottomTolerance = 30;

      if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
        setAutoScrollEnabled(false);
        setShowScrollDownButton(true);
      } else {
        setAutoScrollEnabled(true);
        setShowScrollDownButton(false);
      }
    }
  };

  const handleScrollDown = () => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleSettings = () => {
    setShowSettings(!showSettings);
  };

  const onClearAll = () => {
    if (
      confirm(t<string>('Are you sure you want to clear all messages?')) &&
      selectedConversation
    ) {
      handleUpdateConversation(selectedConversation, {
        key: 'messages',
        value: [],
      });
    }
  };

  const scrollDown = () => {
    if (autoScrollEnabled) {
      messagesEndRef.current?.scrollIntoView(true);
    }
  };
  const throttledScrollDown = throttle(scrollDown, 250);

  // useEffect(() => {
  //   console.log('currentMessage', currentMessage);
  //   if (currentMessage) {
  //     handleSend(currentMessage);
  //     homeDispatch({ field: 'currentMessage', value: undefined });
  //   }
  // }, [currentMessage]);

  useEffect(() => {
    throttledScrollDown();
    selectedConversation &&
      setCurrentMessage(
        selectedConversation.messages[selectedConversation.messages.length - 2],
      );
  }, [selectedConversation, throttledScrollDown]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoScrollEnabled(entry.isIntersecting);
        if (entry.isIntersecting) {
          textareaRef.current?.focus();
        }
      },
      {
        root: null,
        threshold: 0.5,
      },
    );
    const messagesEndElement = messagesEndRef.current;
    if (messagesEndElement) {
      observer.observe(messagesEndElement);
    }
    return () => {
      if (messagesEndElement) {
        observer.unobserve(messagesEndElement);
      }
    };
  }, [messagesEndRef]);

  return (
    <div className="relative flex-1 overflow-hidden bg-white dark:bg-base">
      {(apiKey || serverSideApiKeyIsSet) ? (<div className='flex-shrink-0 fixed z-[1] right-0 top-0 py-2 px-3 flex gap-2 w-full bg-base border-b-[1px] border-border01 justify-end'>
        <div className='left-0 top-3 right-0 absolute mx-auto max-w-max'>
          <Image
            src="/main-logo-beta.svg"
            alt="logo"
            width={140}
            height={30}
          />
        </div>
        {selectedConversation?.messages.length !== 0 ? (
          <button
            className={` max-w-max flex items-center py-1.5 px-3 gap-1 bg-[rgba(255,255,255,0.10)] border-[1px] border-border01 text-xs rounded-md text-white hover:text-gray-400 dark:text-white dark:hover:text-gray-300  sm:text-neutral-700`}
            onClick={() => {
              handleNewConversation();
              // handleSearchTerm('');
            }}
          >
            <IconPlus size={14} />
            New chat
          </button>) : null}
        {/* user profile */}
        <Link href="https://app.dhiwise.com/account/profile" className='cursor-pointer flex items-center gap-2 py-1.5 px-3 text-xs rounded-md bg-[rgba(255,255,255,0.10)] border-[1px] border-border01'>
          <div className='flex gap-1 items-center'>
            <IconUser size={16} />
            parul@dhiwise.com
          </div>
          <IconSettings size={14} />
        </Link>
      </div>) : null}
      {!(apiKey || serverSideApiKeyIsSet) ? (
        <div className="mx-auto flex h-full w-[300px] flex-col justify-center space-y-6 sm:w-[600px] text-center items-center">
          {/* <div className="text-center text-4xl font-bold text-black dark:text-white">
            Welcome to Chatbot UI
          </div>
          <div className="text-center text-lg text-black dark:text-white">
            <div className="mb-8">{`Chatbot UI is an open source clone of OpenAI's ChatGPT UI.`}</div>
            <div className="mb-2 font-bold">
              Important: Chatbot UI is 100% unaffiliated with OpenAI.
            </div>
          </div>
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="mb-2">
              Chatbot UI allows you to plug in your API key to use this UI with
              their API.
            </div>
            <div className="mb-2">
              It is <span className="italic">only</span> used to communicate
              with their API.
            </div>
            <div className="mb-2">
              {t(
                'Please set your OpenAI API key in the bottom left of the sidebar.',
              )}
            </div>
            <div>
              {t("If you don't have an OpenAI API key, you can get one here: ")}
              <a
                href="https://platform.openai.com/account/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline"
              >
                openai.com
              </a>
            </div>
          </div> */}
          <div className='w-[100px] h-[100px] bg-[#FFF] flex mb-6 justify-center items-center border-[1px] border-border01 rounded-full'>
            <Image
              width={50}
              height={50}
              src="/logo.png"
              alt="logo"
            />
          </div>
          <h1 className='text-4xl font-bold'>Get Started With DhiWise</h1>
          <p className='text-base !mt-2 text-white opacity-80'>Build Application with DhiWise</p>
          <div className='grid grid-cols-2 gap-2'>
           <Button variant='secondary' label="Sign in"></Button>
           <Button variant='primary' label="Sign up"></Button>
          </div>
        </div>
      ) : modelError ? (
        <ErrorMessageDiv error={modelError} />
      ) : (
        <>
          <div
            className={`max-h-full pt-[48px] overflow-x-hidden ${selectedConversation?.messages.length === 0 ? "h-full" : ""}`}
            ref={chatContainerRef}
            onScroll={handleScroll}
          >
            {selectedConversation?.messages.length === 0 ? (
              <>
                <div className="pb-[140px] mx-auto flex flex-col h-full space-y-5 md:space-y-10 px-3 pt-5 md:pt-12 sm:max-w-[600px]">
                  <div className='flex flex-col'>
                    <div className='w-[100px] h-[100px] bg-[#FFF] flex mb-6 justify-center items-center border-[1px] border-border01 rounded-full'>
                      <Image
                        width={50}
                        height={50}
                        src="/logo.png"
                        alt="logo"
                      />
                    </div>
                    <h3 className='text-2xl'>DhiWise</h3>
                    <p className='text-base text-white font-light opacity-60'>Flutter and React code generatator from Figma Designs</p>
                  </div>
                  <div className='w-[40rem] grid gap-8'>
                    <div className='grid grid-cols-1 gap-6'>
                      <SelectBox
                        isRequired
                        placeholder='Select Technology'
                        selectBoxOptions={
                          [
                            {
                              value: "React",
                              label: "React"
                            },
                            {
                              value: "Flutter",
                              label: "Flutter"
                            }
                          ]
                        }
                        label='Technology' />
                      <Input isRequired placeholder="Enter Link of Figma Frame" label="Link of Figma Frame" />
                      <Input isRequired placeholder="Enter Figma Token" label="Figma Token" />
                    </div>
                    <div>
                      <Button variant='primary' label="Submit"></Button>
                    </div>
                  </div>
                  {/* <div className="text-center text-3xl font-semibold text-gray-800 dark:text-gray-100">
                    {models.length === 0 ? (
                      <div>
                        <Spinner size="16px" className="mx-auto" />
                      </div>
                    ) : (
                      'Chatbot UI'
                    )}
                  </div> */}
                  {/* <div className='grid grid-cols-2 gap-3 w-[56rem] stretch'>
                  <div className='cursor-pointer truncate text-sm border-border01 rounded-xl border-[1px] px-3 py-3 text-white bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.06)]'>Generate Flutter code from Figma Layout</div>
                  <div className='cursor-pointer truncate text-sm border-border01 rounded-xl border-[1px] px-3 py-3 text-white bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.06)]'>I need Flutter code for this screen layout</div>
                  <div className='cursor-pointer truncate text-sm border-border01 rounded-xl border-[1px] px-3 py-3 text-white bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.06)]'>Here's a Figma design, please convert to Figma code</div>
                  <div className='cursor-pointer truncate text-sm border-border01 rounded-xl border-[1px] px-3 py-3 text-white bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.06)]'>Transform this JSON structure into Futter code</div>
                </div> */}
                  {/* {models.length > 0 && (
                    <div className="flex h-full flex-col space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-600">
                      <ModelSelect />

                      <SystemPrompt
                        conversation={selectedConversation}
                        prompts={prompts}
                        onChangePrompt={(prompt) =>
                          handleUpdateConversation(selectedConversation, {
                            key: 'prompt',
                            value: prompt,
                          })
                        }
                      />

                      <TemperatureSlider
                        label={t('Temperature')}
                        onChangeTemperature={(temperature) =>
                          handleUpdateConversation(selectedConversation, {
                            key: 'temperature',
                            value: temperature,
                          })
                        }
                      />
                    </div>
                  )} */}
                </div>
              </>
            ) : (
              <>
                {/* <div className="sticky top-0 z-10 flex justify-center border border-b-neutral-300 bg-neutral-100 py-2 text-sm text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200">
                  {t('Model')}: {selectedConversation?.model.name} | {t('Temp')}
                  : {selectedConversation?.temperature} |
                  <button
                    className="ml-2 cursor-pointer hover:opacity-50"
                    onClick={handleSettings}
                  >
                    <IconSettings size={18} />
                  </button>
                  <button
                    className="ml-2 cursor-pointer hover:opacity-50"
                    onClick={onClearAll}
                  >
                    <IconClearAll size={18} />
                  </button>
                </div> */}
                {/* {showSettings && (
                  <div className="flex flex-col space-y-10 md:mx-auto md:max-w-xl md:gap-6 md:py-3 md:pt-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
                    <div className="flex h-full flex-col space-y-4 border-b border-neutral-200 p-4 dark:border-neutral-600 md:rounded-lg md:border">
                      <ModelSelect />
                    </div>
                  </div>
                )} */}

                {selectedConversation?.messages.map((message, index) => (
                  <MemoizedChatMessage
                    key={index}
                    message={message}
                    messageIndex={index}
                    onEdit={(editedMessage) => {
                      setCurrentMessage(editedMessage);
                      // discard edited message and the ones that come after then resend
                      handleSend(
                        editedMessage,
                        selectedConversation?.messages.length - index,
                      );
                    }}
                  />
                ))}

                {loading && <ChatLoader />}

                <div
                  className="h-[162px] listitem bg-white dark:bg-base"
                  ref={messagesEndRef}
                />
              </>
            )}
          </div>
          {selectedConversation?.messages.length !== 0 ? (
            <ChatInput
              stopConversationRef={stopConversationRef}
              textareaRef={textareaRef}
              onSend={(message, plugin) => {
                setCurrentMessage(message);
                handleSend(message, 0, plugin);
              }}
              onScrollDownClick={handleScrollDown}
              onRegenerate={() => {
                if (currentMessage) {
                  handleSend(currentMessage, 2, null);
                }
              }}
              showScrollDownButton={showScrollDownButton}
            />) : null}
        </>
      )}
    </div>
  );
});
Chat.displayName = 'Chat';
