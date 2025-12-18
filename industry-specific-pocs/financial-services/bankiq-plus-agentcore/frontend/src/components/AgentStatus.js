/**
 * Agent Status Component - Shows real-time agent activity
 */
import React, { useState, useEffect } from 'react';
import AgentService from '../services/AgentService';

const AgentStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [activeAgents, setActiveAgents] = useState([]);
  const [lastActivity, setLastActivity] = useState(null);

  useEffect(() => {
    // Connect to Strands Agent
    AgentService.connectAgent();

    // Listen for connection status
    AgentService.on('connection', (data) => {
      setConnectionStatus(data.status);
    });

    // Listen for agent activity
    AgentService.on('report_start', (data) => {
      setActiveAgents(prev => [...prev, {
        id: Date.now(),
        type: 'Report Generator',
        bank: data.bank_name,
        status: 'active'
      }]);
      setLastActivity('Report generation started');
    });

    AgentService.on('chat_start', (data) => {
      setActiveAgents(prev => [...prev, {
        id: Date.now(),
        type: 'Financial Analyst',
        bank: data.bank_name,
        status: 'active'
      }]);
      setLastActivity('Analyzing financial question');
    });

    AgentService.on('report_complete', () => {
      setActiveAgents(prev => prev.filter(agent => agent.type !== 'Report Generator'));
      setLastActivity('Report generation completed');
    });

    AgentService.on('chat_response', () => {
      setActiveAgents(prev => prev.filter(agent => agent.type !== 'Financial Analyst'));
      setLastActivity('Financial analysis completed');
    });

    return () => {
      AgentService.disconnect();
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return '#10b981';
      case 'connecting': return '#f59e0b';
      case 'disconnected': return '#ef4444';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Only show panel if there's an error or disconnected
  if (connectionStatus === 'connected') {
    return null;
  }

  return (
    <div className="agent-status-panel" style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      minWidth: '280px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(connectionStatus),
            marginRight: '8px'
          }}
        />
        <span style={{ fontWeight: '600', fontSize: '14px' }}>
          {connectionStatus === 'connected' ? 'Strands Agent Ready' : `Agent ${connectionStatus}`}
        </span>
      </div>

      {activeAgents.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            Active Agents:
          </div>
          {activeAgents.map(agent => (
            <div key={agent.id} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '4px 8px',
              backgroundColor: '#f3f4f6',
              borderRadius: '4px',
              marginBottom: '4px',
              fontSize: '12px'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                marginRight: '8px',
                animation: 'pulse 2s infinite'
              }} />
              <span>{agent.type}</span>
              {agent.bank && (
                <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                  ({agent.bank})
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {lastActivity && (
        <div style={{ fontSize: '11px', color: '#6b7280' }}>
          Last: {lastActivity}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default AgentStatus;