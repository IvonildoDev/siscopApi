import React from 'react';
import { Card, CardContent, CardHeader, Typography, Box } from '@mui/material';

const DashboardCard = ({ title, icon, children, elevation = 3 }) => {
    return (
        <Card elevation={elevation} sx={{ 
            height: '100%', 
            borderRadius: 2,
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
            }
        }}>
            <CardHeader
                avatar={icon}
                title={
                    <Typography variant="h6" fontWeight="bold">
                        {title}
                    </Typography>
                }
                sx={{ 
                    bgcolor: 'primary.light', 
                    color: 'primary.contrastText',
                    pb: 1
                }}
            />
            <CardContent sx={{ p: 2 }}>
                <Box>
                    {children}
                </Box>
            </CardContent>
        </Card>
    );
};

export default DashboardCard;