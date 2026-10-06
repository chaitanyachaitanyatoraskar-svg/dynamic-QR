import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  CircularProgress
} from '@mui/material';
import { auditService } from '../services/api';

export const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await auditService.getLogs();
        setLogs(res.data.results || res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          System Audit Trail
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Immutable log of card provisioning, destination updates, suspensions, and reassignments
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>TIMESTAMP</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>INITIATED BY</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>ACTION</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>CARD ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>BUSINESS</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>AUDIT DETAILS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                        No audit records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((l) => (
                      <TableRow key={l.id} hover>
                        <TableCell variant="body2">{new Date(l.timestamp).toLocaleString()}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{l.username || 'System'}</TableCell>
                        <TableCell>
                          <Chip label={l.action} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{l.card_id || '—'}</TableCell>
                        <TableCell>{l.business_name || '—'}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                          {JSON.stringify(l.details)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
