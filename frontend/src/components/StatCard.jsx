import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = '#2563eb' }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {title}
          </Typography>
          {Icon && (
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                backgroundColor: `${color}15`,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon fontSize="small" />
            </Box>
          )}
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
