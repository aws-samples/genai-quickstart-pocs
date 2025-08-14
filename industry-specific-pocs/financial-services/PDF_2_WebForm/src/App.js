import React, { useState, useEffect } from 'react';
import { 
  AppLayout, TopNavigation, SideNavigation, Table, Container, Header, 
  Pagination, TextFilter, Button, SpaceBetween, Modal, Select, ColumnLayout 
} from '@cloudscape-design/components';

/**
 * PDF to Web Form Converter Application
 * 
 * This React application converts PDF documents stored in S3 buckets into interactive web forms
 * using AWS services including Lambda, API Gateway, WebSocket API, and Bedrock Claude 3.5 Sonnet.
 * 
 * Key Features:
 * - Browse S3 buckets and PDF objects
 * - Extract metadata from PDF documents
 * - Generate code in multiple languages (React.js, HTML, Java, Python, C#)
 * - Real-time code generation using WebSocket streaming
 * - PDF preview functionality
 * - Copy-to-clipboard functionality
 */
function App() {
  // UI State Management
  const [navigationOpen, setNavigationOpen] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [showObjects, setShowObjects] = useState(false);
  const [showCodePanel, setShowCodePanel] = useState(false);
  const [htmlPreviewVisible, setHtmlPreviewVisible] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  
  // S3 Bucket and Object Management
  const [buckets, setBuckets] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [objects, setObjects] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [filteringText, setFilteringText] = useState('');
  
  // PDF Content and Metadata
  const [modalContent, setModalContent] = useState('');
  const [selectedPdfKey, setSelectedPdfKey] = useState('');
  const [pdfContent, setPdfContent] = useState('');
  
  // Code Generation
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [promptText, setPromptText] = useState('');
  const [websocket, setWebsocket] = useState(null);
  
  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [codeGenerationComplete, setCodeGenerationComplete] = useState(false);
  const [htmlGenerationComplete, setHtmlGenerationComplete] = useState(false);
  
  // Constants
  const pageSize = 10;
  const API_ENDPOINTS = {
    S3_OPERATIONS: 'https://z24xc41oyi.execute-api.us-east-1.amazonaws.com/Dev',
    METADATA_EXTRACTION: 'https://0l9wnxb8dh.execute-api.us-east-1.amazonaws.com/Dev',
    PDF_CONTENT: 'https://aw2o2mcvif.execute-api.us-east-1.amazonaws.com/Dev',
    WEBSOCKET: 'wss://bb4bk15ec3.execute-api.us-east-1.amazonaws.com/production/'
  };

  /**
   * Load S3 buckets on component mount
   * Fetches available S3 buckets from the API Gateway endpoint
   */
  useEffect(() => {
    const fetchBuckets = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.S3_OPERATIONS);
        const data = await response.json();
        
        // Handle different response formats from API Gateway
        if (data.body) {
          const bucketList = JSON.parse(data.body).buckets;
          setBuckets(bucketList);
        } else if (data.buckets) {
          setBuckets(data.buckets);
        }
      } catch (error) {
        console.error('Error fetching buckets:', error);
      }
    };
    
    fetchBuckets();
  }, []);

  /**
   * Fetch PDF objects from the selected S3 bucket
   * Filters objects to show only PDF files
   */
  const handleShowObjects = async () => {
    if (selectedItems.length === 0) return;
    
    const bucketName = selectedItems[0].name;
    
    try {
      const response = await fetch(API_ENDPOINTS.S3_OPERATIONS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket_names: [bucketName] })
      });
      
      const data = await response.json();
      
      // Handle different response formats
      if (data.body) {
        const parsed = JSON.parse(data.body);
        setObjects(parsed.pdf_objects[bucketName] || []);
      } else if (data.pdf_objects) {
        setObjects(data.pdf_objects[bucketName] || []);
      }
      
      setShowObjects(true);
    } catch (error) {
      console.error('Error fetching objects:', error);
    }
  };
  
  /**
   * Extract metadata from PDF and fetch PDF content
   * Opens modal with PDF preview, metadata, and code generation options
   */
  const handleMetadataExtraction = async (pdfKey) => {
    const record = {
      Records: [{
        s3: {
          bucket: { name: selectedItems[0]?.name },
          object: { key: pdfKey }
        }
      }]
    };
    
    try {
      setIsLoading(true);
      
      // Extract metadata from PDF
      const metadataResponse = await fetch(API_ENDPOINTS.METADATA_EXTRACTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      
      const metadataData = await metadataResponse.json();
      setModalContent(JSON.stringify(metadataData, null, 2));
      setSelectedPdfKey(pdfKey);
      
      // Fetch PDF content for preview
      const pdfResponse = await fetch(API_ENDPOINTS.PDF_CONTENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: selectedItems[0]?.name,
          key: pdfKey
        })
      });
      
      const pdfData = await pdfResponse.json();
      if (pdfData.pdf_content) {
        setPdfContent(pdfData.pdf_content);
      }
      
      setModalVisible(true);
    } catch (error) {
      console.error('Error extracting metadata:', error);
      setModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Generate code using WebSocket streaming
   * Connects to WebSocket API and streams generated code in real-time
   */
  const handleCodeGeneration = () => {
    if (!selectedLanguage) return;
    
    try {
      setIsGenerating(true);
      setGeneratedCode('');
      setCodeGenerationComplete(false);
      setShowCodePanel(true);
      
      const ws = new WebSocket(API_ENDPOINTS.WEBSOCKET);
      setWebsocket(ws);
      
      ws.onopen = () => {
        ws.send(JSON.stringify({
          action: 'generate',
          metadata: JSON.parse(modalContent),
          language: selectedLanguage,
          prompt: promptText
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'content_block_delta' && data.delta?.text) {
            setGeneratedCode(prev => prev + data.delta.text);
          } else if (data.type === 'message_delta' && data.delta?.stop_reason === 'end_turn') {
            setIsGenerating(false);
            setCodeGenerationComplete(true);
            ws.close();
            setWebsocket(null);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          setGeneratedCode(prev => prev + event.data);
        }
      };
      
      ws.onclose = () => {
        setIsGenerating(false);
        setWebsocket(null);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        ws.close();
        setWebsocket(null);
        setIsGenerating(false);
      };
    } catch (error) {
      console.error('Code generation error:', error);
      if (websocket) {
        websocket.close();
        setWebsocket(null);
      }
      setIsGenerating(false);
    }
  };
  
  /**
   * Set prompt text based on selected programming language
   */
  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
    
    if (language.toLowerCase() === 'reactjs') {
      setPromptText(`Based on the following PDF metadata, generate react code using https://cloudscape.design/demos/ as reference for taking user input.
Create form fields for each field found in the metadata, and ensure that right type of field or controls are associated with each field, don't create a separate style sheet, embed all the styles within the same code

Metadata: {metadata}

Generate react based web form with:
- Having right field along with right type of controls
- if there are fields nested within a field, then show the nested field as options for the primary field
- Basic CSS styling inline or in style tags
- Form validation attributes
- Submit button

Return only the code without any explanations and so that it be executed or displayed as popup.`);
    } else {
      setPromptText(`Based on the following PDF metadata, generate ${language} form code for user input.
Create form fields for each field found in the metadata.

Metadata: {metadata}

Generate ${language} form with:
- Form elements
- Basic styling
- Form validation
- Submit functionality

Return only code without explanations.`);
    }
  };
  
  /**
   * Clean up WebSocket connection and reset modal state
   */
  const handleModalClose = () => {
    if (websocket) {
      websocket.close();
      setWebsocket(null);
    }
    setModalVisible(false);
    setSelectedLanguage('');
    setShowCodePanel(false);
    setGeneratedCode('');
    setCodeGenerationComplete(false);
  };



  return (
    <>
      <TopNavigation
        identity={{
          href: "#",
          title: "PDF To WebPage App"
        }}
      />
      <AppLayout
        navigationOpen={navigationOpen}
        onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
        navigation={
          <SideNavigation
            header={{ text: "Navigation", href: "#" }}
            items={[
              { type: "section", text: "Services used for Demo", items: [
                { type: "link", text: "Bedrock Data Automation", href: "https://docs.aws.amazon.com/bedrock/latest/userguide/bda-using-api.html", external: true },
                { type: "link", text: "WebSocket API Gateway", href: "https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html", external: true },
                { type: "link", text: "API Gateway", href: "https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html", external: true },
                { type: "link", text: "S3 Bucket", href: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html", external: true },
                { type: "link", text: "Lambda", href: "https://docs.aws.amazon.com/lambda/latest/dg/welcome.html", external: true },
                { type: "link", text: "Bedrock Claude 3", href: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-claude.html", external: true }
              ]}
            ]}
          />
        }
        content={
          <SpaceBetween size="l">
            <Container header={<Header>S3 Buckets</Header>}>
              <SpaceBetween size="s">
                <Table
                  columnDefinitions={[
                    {
                      id: 'name',
                      header: 'Bucket Name',
                      cell: item => item.name
                    }
                  ]}
                  items={buckets
                    .filter(bucket => bucket.toLowerCase().includes(filteringText.toLowerCase()))
                    .slice((currentPageIndex - 1) * pageSize, currentPageIndex * pageSize)
                    .map(bucket => ({ name: bucket, id: bucket }))}
                  selectedItems={selectedItems}
                  onSelectionChange={({ detail }) => {
                    setTimeout(() => {
                      setSelectedItems(detail.selectedItems);
                      setShowObjects(false);
                    }, 0);
                  }}
                  trackBy="id"
                  selectionType="single"
                  filter={
                    <TextFilter
                      filteringText={filteringText}
                      onChange={({ detail }) => {
                        setFilteringText(detail.filteringText);
                        setCurrentPageIndex(1);
                      }}
                      filteringPlaceholder="Search buckets"
                    />
                  }
                  pagination={
                    <Pagination
                      currentPageIndex={currentPageIndex}
                      pagesCount={Math.ceil(buckets.filter(bucket => bucket.toLowerCase().includes(filteringText.toLowerCase())).length / pageSize)}
                      onChange={({ detail }) => {
                        setTimeout(() => {
                          setCurrentPageIndex(detail.currentPageIndex);
                          setSelectedItems([]);
                          setShowObjects(false);
                        }, 0);
                      }}
                    />
                  }
                />
                <Button
                  variant="primary"
                  disabled={selectedItems.length === 0}
                  onClick={handleShowObjects}
                >
                  Show Objects
                </Button>
              </SpaceBetween>
            </Container>
            {showObjects && (
              <Container header={<Header>Objects in {selectedItems[0]?.name}</Header>}>
                <Table
                  columnDefinitions={[
                    {
                      id: 'object',
                      header: 'Object Name',
                      cell: item => item
                    },
                    {
                      id: 'metadata',
                      header: 'Actions',
                      cell: item => (
                        <Button
                          variant="normal"
                          loading={isLoading}
                          onClick={() => handleMetadataExtraction(item)}
                        >
                          Metadata
                        </Button>
                      )
                    }
                  ]}
                  items={objects}
                />
              </Container>
            )}
          </SpaceBetween>
        }
      />
      <Modal
        visible={modalVisible}
        onDismiss={handleModalClose}
        header="Translate Metadata to Code"
        closeAriaLabel="Close modal"
        size="max"
      >
        <SpaceBetween size="m">
          <SpaceBetween direction="horizontal" size="s">
            <Button
              onClick={() => navigator.clipboard.writeText(modalContent)}
              iconName="copy"
            >
              Copy
            </Button>
            <Select
              selectedOption={selectedLanguage ? { label: selectedLanguage, value: selectedLanguage } : null}
              onChange={({ detail }) => handleLanguageChange(detail.selectedOption.value)}
              options={[
                { label: 'React.js', value: 'reactjs' },
                { label: 'Java', value: 'java' },
                { label: 'Python', value: 'python' },
                { label: 'C#', value: 'csharp' }
              ]}
              placeholder="Select language"
            />
            <Button
              disabled={!selectedLanguage}
              loading={isGenerating}
              onClick={handleCodeGeneration}
              iconName="gen-ai"
            >
              Generate Code
            </Button>
          </SpaceBetween>
          {selectedLanguage && (
            <Container header={<Header>Prompt</Header>}>
              <SpaceBetween size="s">
                <SpaceBetween direction="horizontal" size="s">
                  <Button
                    onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                    iconName="edit"
                  >
                    {isEditingPrompt ? 'Cancel' : 'Edit'}
                  </Button>
                  {isEditingPrompt && (
                    <Button
                      onClick={() => setIsEditingPrompt(false)}
                      variant="primary"
                      iconName="check"
                    >
                      Save
                    </Button>
                  )}
                </SpaceBetween>
                {isEditingPrompt ? (
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    style={{ width: '100%', height: '200px', fontFamily: 'monospace' }}
                  />
                ) : (
                  <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{promptText}</pre>
                )}
              </SpaceBetween>
            </Container>
          )}
          <ColumnLayout columns={showCodePanel ? 3 : 2}>
            <Container header={<Header>PDF Preview</Header>}>
              {pdfContent ? (
                <iframe
                  src={`data:application/pdf;base64,${pdfContent}`}
                  style={{ width: '100%', height: '500px', border: 'none' }}
                  title="PDF Preview"
                />
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', height: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p><strong>PDF File:</strong> {selectedPdfKey}</p>
                  <p><strong>Bucket:</strong> {selectedItems[0]?.name}</p>
                  <p style={{ color: '#666', marginTop: '20px' }}>Loading PDF...</p>
                </div>
              )}
            </Container>
            <Container header={<Header>Metadata</Header>}>
              <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{modalContent}</pre>
            </Container>
            {showCodePanel && (
              <Container header={<Header>Generated Code ({selectedLanguage})</Header>}>
                <SpaceBetween size="s">
                  <Button
                    onClick={() => navigator.clipboard.writeText(generatedCode)}
                    iconName="copy"
                  >
                    Copy Code
                  </Button>
                  <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{generatedCode}</pre>
                </SpaceBetween>
              </Container>
            )}
          </ColumnLayout>
        </SpaceBetween>
      </Modal>

    </>
  );
}

export default App;