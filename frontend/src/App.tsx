import { ChatInput } from './components/chat/ChatInput';
import { ChatThread } from './components/chat/ChatThread';
import { ToolBar } from './components/chat/ToolBar';
import { WelcomeScreen } from './components/chat/WelcomeScreen';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { useChatState } from './hooks/useChatState';
import { useSidebarState } from './hooks/useSidebarState';
import styles from './App.module.css';

function App() {
  const {
    messages,
    input,
    setInput,
    activeToolKey,
    setActiveToolKey,
    greeting,
    tease,
    hasStarted,
    backendOnline,
    geminiReady,
    datasetInfo,
    loading,
    backendError,
    selectedCompany,
    setSelectedCompany,
    companyOptions,
    companiesLoading,
    hasCompany,
    sendMessage,
    runTool,
    runActiveTool,
    startNewChat,
    streamTargetId,
  } = useChatState();

  const { expanded, toggle } = useSidebarState();

  const inputDisabled = !backendOnline || loading || !hasCompany;

  return (
    <div className={styles.app}>
      <Sidebar onNewChat={startNewChat} expanded={expanded} onToggle={toggle} />

      <main className={styles.main}>
        <TopBar
          backendOnline={backendOnline}
          geminiReady={geminiReady}
          companyCount={datasetInfo?.companyCount}
          companyOptions={companyOptions}
          selectedCompany={selectedCompany}
          onCompanyChange={setSelectedCompany}
          companiesLoading={companiesLoading}
        />

        {backendError && (
          <div className={styles.backendBanner} role="status">
            {backendError === 'Backend unreachable'
              ? 'Backend offline — run `npm run dev` from project root'
              : 'Backend connected · add GEMINI_API_KEY to backend/.env and restart'}
          </div>
        )}

        <div className={styles.workspace}>
          <div
            className={`${styles.threadScroll} ${!hasStarted ? styles.threadScrollCentered : ''}`}
          >
            {!hasStarted ? (
              <WelcomeScreen
                greeting={greeting}
                tease={tease}
                datasetLabel={
                  backendOnline && datasetInfo
                    ? `${datasetInfo.companyCount} companies · ${datasetInfo.snapshotLabel} workbook (API)`
                    : undefined
                }
                hint={
                  backendOnline && !hasCompany
                    ? 'Select a company from the header dropdown to begin.'
                    : undefined
                }
              />
            ) : (
              <ChatThread
                messages={messages}
                onChipSelect={sendMessage}
                streamTargetId={streamTargetId}
              />
            )}
          </div>

          <div className={styles.composerDock}>
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={sendMessage}
              activeToolKey={activeToolKey}
              onToolChange={setActiveToolKey}
              onRunActiveTool={runActiveTool}
              compact={hasStarted}
              disabled={inputDisabled}
              placeholder={
                !backendOnline
                  ? 'Waiting for backend API on port 3001…'
                  : !hasCompany
                    ? 'Select a company from the header dropdown first…'
                    : 'Ask about the selected company — responses from backend + Gemini'
              }
            />

            <ToolBar onRunTool={(toolId, label) => runTool(toolId, label)} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
