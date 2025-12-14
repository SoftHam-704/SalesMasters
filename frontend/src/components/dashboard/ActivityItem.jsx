import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Phone, Calendar, Target, Mail } from 'lucide-react';

const iconMap = {
    deal: CheckCircle,
    call: Phone,
    meeting: Calendar,
    goal: Target,
    email: Mail,
};

export const ActivityItem = ({ type, title, description, time, delay = 0 }) => {
    const Icon = iconMap[type] || CheckCircle;

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            className="activity-item"
        >
            <div className="activity-icon-wrapper">
                <Icon className="activity-icon" size={16} />
            </div>
            <div className="activity-content">
                <p className="activity-title">{title}</p>
                <p className="activity-description">{description}</p>
            </div>
            <span className="activity-time">{time}</span>
        </motion.div>
    );
};
