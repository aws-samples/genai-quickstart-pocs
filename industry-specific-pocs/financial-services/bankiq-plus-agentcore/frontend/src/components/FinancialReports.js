import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, Grid, Button,
  TextField, Paper, Chip, List, ListItem, ListItemText,
  CircularProgress, Alert, Divider
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import CloudIcon from '@mui/icons-material/Cloud';
import SearchIcon from '@mui/icons-material/Search';
import { api } from '../services/api';
import ReactMarkdown from 'react-markdown';

function FinancialReports() {
  const [selectedBank, setSelectedBank] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [reports, setReports] = useState({ '10-K': [], '10-Q': [] });
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState('');
  const [fullReport, setFullReport] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [pollingStatus, setPollingStatus] = useState('');
  const [mode, setMode] = useState('live'); // 'live' or 'local'
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analyzedDocs, setAnalyzedDocs] = useState([]);
  const [searchBank, setSearchBank] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedBankCik, setSelectedBankCik] = useState(null);

  const popularBanks = {
    "JPMORGAN CHASE & CO": "0000019617",
    "BANK OF AMERICA CORP": "0000070858",
    "WELLS FARGO & COMPANY": "0000072971",
    "CITIGROUP INC": "0000831001",
    "GOLDMAN SACHS GROUP INC": "0000886982",
    "MORGAN STANLEY": "0000895421",
    "U.S. BANCORP": "0000036104",
    "PNC FINANCIAL SERVICES GROUP INC": "0000713676",
    "CAPITAL ONE FINANCIAL CORP": "0000927628",
    "TRUIST FINANCIAL CORP": "0001534701"
  };

  useEffect(() => {
    if (selectedBank && mode !== 'local') {
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBank, selectedBankCik, mode]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await api.getSECReports(selectedBank, 2024, mode === 'rag', selectedBankCik);
      setReports(data);
    } catch (err) {
      setError('Failed to load SEC reports');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (predefinedMessage = null) => {
    const messageToSend = predefinedMessage || chatMessage;
    if (!messageToSend.trim()) return;
    
    if (!predefinedMessage) setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: messageToSend }]);
    
    try {
      setChatLoading(true);
      
      // Add empty assistant message
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: '',
        sources: []
      }]);
      
      let response;
      if (mode === 'local') {
        response = await api.chatWithLocalFiles(messageToSend, analyzedDocs);
      } else {
        response = await api.chatWithAI(messageToSend, selectedBank, reports, mode === 'rag', selectedBankCik);
      }
      setChatHistory(prev => {
        const newHistory = [...prev];
        const lastIndex = newHistory.length - 1;
        if (newHistory[lastIndex] && newHistory[lastIndex].role === 'assistant') {
          // Remove DATA: line from chat display (it's for parsing only)
          let cleanContent = response.response;
          if (cleanContent.includes('DATA:')) {
            cleanContent = cleanContent.replace(/DATA:\s*\{[\s\S]*?\}\s*\n+/g, '').trim();
          }
          // Remove duplicate "AI:" prefix if present
          if (cleanContent.startsWith('AI:')) {
            cleanContent = cleanContent.substring(3).trim();
          }
          newHistory[lastIndex].content = cleanContent;
          newHistory[lastIndex].sources = response.sources || [];
        }
        return newHistory;
      });
      

      
    } catch (err) {
      console.error('Chat error:', err);
      // Update the existing empty assistant message with error instead of adding new one
      setChatHistory(prev => {
        const newHistory = [...prev];
        const lastIndex = newHistory.length - 1;
        if (newHistory[lastIndex] && newHistory[lastIndex].role === 'assistant') {
          newHistory[lastIndex].content = `Error: ${err.message || 'Failed to get AI response'}`;
        } else {
          // Fallback: add new error message if no empty message exists
          newHistory.push({ 
            role: 'assistant', 
            content: `Error: ${err.message || 'Failed to get AI response'}` 
          });
        }
        return newHistory;
      });
    } finally {
      setChatLoading(false);
    }
  };

  const generateFullReport = async () => {
    try {
      setReportLoading(true);
      setFullReport('');
      setError('');
      
      let inputText;
      if (mode === 'local' && analyzedDocs.length > 0) {
        const doc = analyzedDocs[0];
        if (doc.s3_key) {
          inputText = `Use the analyze_uploaded_pdf tool to generate a comprehensive financial analysis report.

Call analyze_uploaded_pdf with these parameters:
- s3_key: "${doc.s3_key}"
- bank_name: "${doc.bank_name}"
- analysis_type: "comprehensive"

Generate a detailed 8-section report with markdown headers covering all aspects of the bank's financial performance.`;
        } else {
          inputText = `Generate a comprehensive financial analysis report for ${selectedBank} based on their ${doc.form_type} filing for fiscal year ${doc.year}. ` +
            `Use publicly available data and SEC filings.`;
        }
      } else {
        inputText = `Use the generate_bank_report tool to create a comprehensive financial analysis report for ${selectedBank}. Call generate_bank_report with bank_name: "${selectedBank}".`;
      }
      
      // Submit async job
      console.log('Submitting async job for full report...');
      setPollingStatus('Submitting request...');
      const jobSubmission = await api.submitJob(inputText, 'full-report');
      const jobId = jobSubmission.jobId;
      
      console.log(`Job ${jobId} submitted, polling for completion...`);
      setPollingStatus('Generating report (this may take 1-2 minutes)...');
      
      // Poll for completion (max 4 minutes = 120 attempts * 2 seconds)
      const result = await api.pollJobUntilComplete(jobId, 120, 2000);
      
      if (result.status === 'failed') {
        throw new Error(result.error || 'Job failed');
      }
      
      // Remove DATA: line from report display
      let cleanReport = result.result;
      if (cleanReport.includes('DATA:')) {
        cleanReport = cleanReport.replace(/DATA:\s*\{[\s\S]*?\}\s*\n+/g, '').trim();
      }
      
      setFullReport(cleanReport);
      setPollingStatus('');
      console.log('Full report generated successfully');
      
    } catch (err) {
      console.error('Full report generation error:', err);
      setError('Failed to generate full report: ' + err.message);
      setPollingStatus('');
    } finally {
      setReportLoading(false);
    }
  };

  const handleBankSearch = async () => {
    if (!searchBank.trim()) return;
    
    try {
      setSearching(true);
      setError('');
      setSearchResults([]);
      setSelectedBank('');
      setSelectedBankCik(null);
      setReports({ '10-K': [], '10-Q': [] });
      
      const results = await api.searchBanks(searchBank);
      setSearchResults(results);
      
      if (results.length === 0) {
        setError(`Sorry, I couldn't find "${searchBank}" in our supported banks database. Please search for banking and financial institutions only (e.g., Goldman Sachs, Morgan Stanley, Ally Financial).`);
      }
    } catch (err) {
      setError('Failed to search banks');
    } finally {
      setSearching(false);
    }
  };

  const downloadReport = () => {
    const bankName = selectedBank.replace(/[^a-zA-Z0-9]/g, '_');
    const element = document.createElement('a');
    const file = new Blob([fullReport], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${bankName}_Financial_Analysis_Report.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Financial Reports Analyzer
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: '1px solid #ddd', borderRadius: 2, backgroundColor: '#f5f5f5' }}>
          <Button 
            variant={mode === 'local' ? 'contained' : 'text'} 
            size="small"
            onClick={() => {
              setMode('local');
              setSelectedBank('');
              setChatHistory([]);
              setFullReport('');
              setReports({ '10-K': [], '10-Q': [] });
              setError('');
              setReportLoading(false);
            }}
            startIcon={<DescriptionIcon />}
            sx={{ minWidth: 80, fontSize: '0.8rem' }}
          >
            Local
          </Button>

          <Button 
            variant={mode === 'live' ? 'contained' : 'text'} 
            size="small"
            onClick={() => {
              setMode('live');
              setSelectedBank('');
              setChatHistory([]);
              setFullReport('');
              setReports({ '10-K': [], '10-Q': [] });
              setUploadedFiles([]);
              setAnalyzedDocs([]);
              setError('');
              setReportLoading(false);
            }}
            startIcon={<CloudIcon />}
            sx={{ minWidth: 80, fontSize: '0.8rem' }}
          >
            Live
          </Button>
        </Box>
      </Box>

      {/* Bank Selection */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          {mode === 'live' ? (
            <>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudIcon /> Live EDGAR Mode - Real-time SEC Data (Banking Companies Only)
              </Typography>
              
              {/* Bank Search */}
              <Box sx={{ display: 'flex', gap: 1, mb: 3, alignItems: 'center' }}>
                <TextField
                  placeholder="Search for any bank or financial institution..."
                  value={searchBank}
                  onChange={(e) => setSearchBank(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBankSearch()}
                  size="small"
                  sx={{ minWidth: 300 }}
                />
                <Button 
                  variant="contained" 
                  onClick={handleBankSearch}
                  disabled={!searchBank.trim() || searching}
                  startIcon={searching ? <CircularProgress size={16} /> : <SearchIcon />}
                >
                  {searching ? 'Searching...' : 'Search'}
                </Button>
                {(selectedBank || searchResults.length > 0 || chatHistory.length > 0 || fullReport) && (
                  <Button 
                    variant="outlined" 
                    onClick={() => {
                      setSelectedBank('');
                      setSelectedBankCik(null);
                      setChatHistory([]);
                      setFullReport('');
                      setReports({ '10-K': [], '10-Q': [] });
                      setSearchResults([]);
                      setSearchBank('');
                      setError('');
                      setReportLoading(false);
                      setPollingStatus('');
                    }}
                    color="secondary"
                  >
                    🗑️ Clear All
                  </Button>
                )}
              </Box>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Search Results:</Typography>
                  <Grid container spacing={1}>
                    {searchResults.map((result, index) => (
                      <Grid item key={index}>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setSelectedBank(result.name);
                            setSelectedBankCik(result.cik);
                            setChatHistory([]);
                            setFullReport('');
                            setReports({ '10-K': [], '10-Q': [] });
                            setError('');
                            setSearchResults([]);
                            setSearchBank('');
                            setReportLoading(false);
                            setPollingStatus('');
                          }}
                          sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                        >
                          🏦 {result.name}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
              
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>Or select from 10 popular banks:</Typography>
              <Grid container spacing={2}>
                {Object.entries(popularBanks).map(([bankName, cik]) => (
                  <Grid item key={bankName}>
                    <Button
                      variant={selectedBank === bankName ? 'contained' : 'outlined'}
                      onClick={() => {
                        setSelectedBank(bankName);
                        setSelectedBankCik(cik);
                        setChatHistory([]);
                        setFullReport('');
                        setReports({ '10-K': [], '10-Q': [] });
                        setError('');
                        setReportLoading(false);
                        setPollingStatus('');
                      }}
                      sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                    >
                      🏦 {bankName.replace(' INC', '').replace(' CORP', '').replace(' GROUP', '').replace(' CORPORATION', '')}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : (
            <>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionIcon /> Local Upload - Your Documents
              </Typography>
              <input type="file" multiple accept=".pdf" onChange={(e) => {
                const files = Array.from(e.target.files);
                setUploadedFiles(files);
                setAnalyzedDocs([]);
              }} style={{display: 'none'}} id="file-upload" />
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <label htmlFor="file-upload">
                  <Button variant="outlined" component="span">Choose PDF Files</Button>
                </label>
                {uploadedFiles.length > 0 && (
                  <Button 
                    variant="contained" 
                    onClick={async () => {
                      try {
                        setLoading(true);
                        setError('');
                        
                        // Convert files to base64 for upload
                        const filePromises = uploadedFiles.map(file => {
                          return new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              resolve({
                                name: file.name,
                                size: file.size,
                                content: e.target.result.split(',')[1] // Get base64 part
                              });
                            };
                            reader.readAsDataURL(file);
                          });
                        });
                        
                        const filesData = await Promise.all(filePromises);
                        
                        // Upload to backend
                        const response = await api.uploadPDFs(filesData);
                        
                        if (response.success && response.documents) {
                          setAnalyzedDocs(response.documents);
                          setChatHistory([]);
                          setFullReport('');
                          
                          // Auto-select first bank
                          if (response.documents.length > 0) {
                            setSelectedBank(response.documents[0].bank_name);
                          }
                        } else {
                          setError('Failed to analyze PDFs');
                        }
                      } catch (err) {
                        console.error('PDF upload error:', err);
                        setError('PDF upload failed: ' + err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : '📤'} Upload
                  </Button>
                )}
                {(uploadedFiles.length > 0 || analyzedDocs.length > 0) && (
                  <Button 
                    variant="outlined" 
                    onClick={() => {
                      setUploadedFiles([]);
                      setAnalyzedDocs([]);
                      setChatHistory([]);
                      setFullReport('');
                      setSelectedBank('');
                      setError('');
                      setReportLoading(false);
                      setPollingStatus('');
                    }}
                    color="secondary"
                  >
                    🗑️ Clear All
                  </Button>
                )}
              </Box>
              
              {analyzedDocs.length > 0 && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  ✅ Successfully uploaded {analyzedDocs.map(doc => `${doc.bank_name} ${doc.form_type}`).join(', ')} document{analyzedDocs.length > 1 ? 's' : ''}
                </Alert>
              )}
              
              {uploadedFiles.length > 0 && analyzedDocs.length === 0 && (
                <List>
                  {uploadedFiles.map((file, i) => (
                    <ListItem key={i}>
                      <ListItemText primary={file.name} secondary={`${(file.size/1024/1024).toFixed(2)} MB`} />
                      <Button onClick={() => {
                        setUploadedFiles(prev => prev.filter((_, idx) => idx !== i));
                        setAnalyzedDocs(prev => prev.filter((_, idx) => idx !== i));
                      }}>Remove</Button>
                    </ListItem>
                  ))}
                </List>
              )}
            </>
          )}
        </Grid>
      </Grid>

      {(selectedBank || (mode === 'local' && uploadedFiles.length > 0)) && (
        <Grid container spacing={4}>
          {/* Available Reports */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <DescriptionIcon sx={{ mr: 1 }} />
                  {mode === 'local' ? 'Uploaded Documents' : 'Available SEC Filings'}
                </Typography>
                {mode === 'live' && selectedBank && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                    📅 Showing filings from 2023-2025
                  </Typography>
                )}
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : mode === 'local' ? (
                  <List>
                    {analyzedDocs.map((doc, index) => (
                      <ListItem key={index} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label={doc.form_type} 
                                size="small" 
                                color={doc.form_type === '10-K' ? 'primary' : 'secondary'}
                              />
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {doc.bank_name} - {doc.form_type} {doc.year}
                              </Typography>
                            </Box>
                          }
                          secondary={`File: ${doc.filename} (${(doc.size/1024/1024).toFixed(2)} MB)`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <List>
                    {[...(reports['10-K'] || []), ...(reports['10-Q'] || [])].map((report, index) => (
                      <ListItem key={index} sx={{ border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label={report.form || report.type} 
                                size="small" 
                                color={report.form === '10-K' ? 'primary' : 'secondary'}
                              />
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {report.accession || report.title}
                              </Typography>
                            </Box>
                          }
                          secondary={`Filed: ${report.filing_date || report.date}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Chat Interface */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <ChatIcon sx={{ mr: 1 }} />
                  AI Chat Interface
                </Typography>
                
                {/* Chat History */}
                <Paper 
                  elevation={0} 
                  sx={{ 
                    height: 400, 
                    p: 2, 
                    mb: 2, 
                    backgroundColor: '#f8f9fa',
                    overflowY: 'auto'
                  }}
                >
                  {chatHistory.length === 0 ? (
                    <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {mode === 'local' ? 'Ask questions about your uploaded documents...' : `Ask questions about ${selectedBank}'s financial reports...`}
                    </Typography>
                  ) : (
                    chatHistory.map((message, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            color: message.role === 'user' ? 'primary.main' : 'secondary.main'
                          }}
                        >
                          {message.role === 'user' ? 'You:' : 'AI:'}
                        </Typography>
                        <Box sx={{ 
                          mb: 1,
                          '& h1, & h2, & h3': { mt: 1.5, mb: 1, fontWeight: 600 },
                          '& h2': { fontSize: '1.25rem', color: '#A020F0' },
                          '& h3': { fontSize: '1.1rem', color: '#8B1A9B' },
                          '& p': { mb: 1, lineHeight: 1.6 },
                          '& ul, & ol': { pl: 2.5, mb: 1 },
                          '& li': { mb: 0.3 },
                          '& strong': { fontWeight: 600, color: '#A020F0' },
                          '& code': { backgroundColor: '#f5f5f5', padding: '2px 4px', borderRadius: '3px', fontSize: '0.9em' }
                        }}>
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </Box>
                        {message.sources && message.sources.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                              Sources:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                              {message.sources.map((source, idx) => (
                                <Chip 
                                  key={idx}
                                  label={`${source.filing_type} ${source.year}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    ))
                  )}
                  
                  {chatLoading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'secondary.main' }}>AI:</Typography>
                      <Typography>Analyzing financial reports...</Typography>
                    </Box>
                  )}
                </Paper>

                {/* Chat Input */}
                {/* Sample Questions */}
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>Sample Questions:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {[
                    'What are the key risk factors?',
                    'How is the financial performance?', 
                    'What are the main revenue sources?',
                    'Any regulatory concerns?'
                  ].map((question) => (
                    <Button 
                      key={question}
                      variant="outlined"
                      size="small"
                      onClick={() => handleSendMessage(question)}
                      disabled={chatLoading}
                    >
                      {question}
                    </Button>
                  ))}
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Ask about risk factors, financial performance, etc."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    size="small"
                  />
                  <Button 
                    variant="contained" 
                    onClick={() => handleSendMessage()}
                    disabled={!chatMessage.trim() || chatLoading || (mode === 'local' && uploadedFiles.length === 0)}
                  >
                    {chatLoading ? 'Analyzing...' : 'Send'}
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={generateFullReport}
                    disabled={loading || reportLoading}
                    sx={{ backgroundColor: '#A020F0', '&:hover': { backgroundColor: '#8B1A9B' } }}
                  >
                    {reportLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : '🚀'} Generate Full Analysis
                  </Button>
                  {pollingStatus && (
                    <Typography variant="caption" sx={{ color: '#A020F0', textAlign: 'center', fontStyle: 'italic' }}>
                      {pollingStatus}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Full Report Display */}
      {fullReport && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                📊 Full Financial Analysis Report{mode === 'local' ? ' - Uploaded Documents' : ` - ${selectedBank}`}
              </Typography>
              <Button 
                variant="outlined" 
                onClick={downloadReport}
                startIcon={<DownloadIcon />}
              >
                Download Report
              </Button>
            </Box>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                backgroundColor: '#f8f9fa',
                maxHeight: 600,
                overflowY: 'auto',
                border: '1px solid #e0e0e0'
              }}
            >
              <Box sx={{ 
                '& h1, & h2, & h3': { mt: 2, mb: 1.5, fontWeight: 600 },
                '& h1': { fontSize: '1.75rem', color: '#A020F0', borderBottom: '2px solid #A020F0', pb: 1 },
                '& h2': { fontSize: '1.5rem', color: '#A020F0' },
                '& h3': { fontSize: '1.25rem', color: '#8B1A9B' },
                '& p': { mb: 2, lineHeight: 1.8, fontSize: '1rem' },
                '& ul, & ol': { pl: 3, mb: 2 },
                '& li': { mb: 0.75, lineHeight: 1.7 },
                '& strong': { fontWeight: 600, color: '#A020F0' },
                '& em': { fontStyle: 'italic', color: '#666' },
                '& blockquote': { borderLeft: '4px solid #A020F0', pl: 2, ml: 0, fontStyle: 'italic', color: '#666' }
              }}>
                <ReactMarkdown>{fullReport}</ReactMarkdown>
              </Box>
            </Paper>
          </CardContent>
        </Card>
      )}


      
      {!selectedBank && mode === 'live' && (
        <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#f8f9fa' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            ☁️ Live EDGAR Mode - Banking Companies Only
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Search for any publicly traded bank or select from the 10 popular banks above. Platform supports all banking and financial institutions with SEC filings.
          </Typography>
        </Paper>
      )}
      
      {mode === 'local' && uploadedFiles.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#f8f9fa' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            📄 Local Upload Mode - Your Documents
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Upload your own 10-K/10-Q PDF files for private analysis. Files are processed securely.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default FinancialReports;