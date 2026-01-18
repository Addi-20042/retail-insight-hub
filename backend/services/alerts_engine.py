"""
Smart Alerts Engine
Generates alerts based on sales trends and anomalies
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict
import json
import os

ALERTS_PATH = 'models/generated_alerts.json'

def detect_anomalies(daily_sales: pd.DataFrame, threshold: float = 2.0) -> List[Dict]:
    """
    Detect anomalies in sales data using statistical methods
    
    Args:
        daily_sales: Daily aggregated sales
        threshold: Z-score threshold for anomaly detection
        
    Returns:
        list: Detected anomalies
    """
    if daily_sales.empty or len(daily_sales) < 7:
        return []
    
    df = daily_sales.copy()
    df['date'] = pd.to_datetime(df['date'])
    
    # Calculate rolling statistics
    df['rolling_mean'] = df['revenue'].rolling(window=7, min_periods=1).mean()
    df['rolling_std'] = df['revenue'].rolling(window=7, min_periods=1).std()
    
    # Calculate z-scores
    df['z_score'] = (df['revenue'] - df['rolling_mean']) / df['rolling_std'].replace(0, 1)
    
    anomalies = []
    
    # Detect spikes and drops
    for _, row in df.iterrows():
        if abs(row['z_score']) > threshold:
            anomaly_type = 'spike' if row['z_score'] > 0 else 'drop'
            severity = 'high' if abs(row['z_score']) > 3 else 'medium'
            
            anomalies.append({
                'date': row['date'].strftime('%Y-%m-%d'),
                'type': anomaly_type,
                'severity': severity,
                'value': float(row['revenue']),
                'expected': float(row['rolling_mean']),
                'deviation': float(abs(row['z_score']))
            })
    
    return anomalies


def generate_trend_alerts(daily_sales: pd.DataFrame) -> List[Dict]:
    """
    Generate alerts based on overall trends
    
    Args:
        daily_sales: Daily aggregated sales
        
    Returns:
        list: Trend-based alerts
    """
    if daily_sales.empty or len(daily_sales) < 14:
        return []
    
    alerts = []
    
    # Compare recent week to previous week
    recent = daily_sales.tail(7)['revenue'].mean()
    previous = daily_sales.iloc[-14:-7]['revenue'].mean() if len(daily_sales) >= 14 else recent
    
    change_pct = ((recent - previous) / previous * 100) if previous > 0 else 0
    
    if change_pct > 20:
        alerts.append({
            'type': 'trend_up',
            'severity': 'info',
            'message': f'Sales increased by {change_pct:.1f}% compared to last week',
            'change_percentage': round(change_pct, 1)
        })
    elif change_pct < -20:
        alerts.append({
            'type': 'trend_down',
            'severity': 'warning',
            'message': f'Sales decreased by {abs(change_pct):.1f}% compared to last week',
            'change_percentage': round(change_pct, 1)
        })
    
    return alerts


def generate_all_alerts(daily_sales: pd.DataFrame = None) -> List[Dict]:
    """
    Generate all types of alerts
    
    Args:
        daily_sales: Daily aggregated sales data
        
    Returns:
        list: All generated alerts
    """
    if daily_sales is None or len(daily_sales) == 0:
        return generate_sample_alerts()
    
    alerts = []
    
    # Detect anomalies
    anomalies = detect_anomalies(daily_sales)
    for a in anomalies[-5:]:  # Limit to recent anomalies
        alert_type = 'demand_spike' if a['type'] == 'spike' else 'demand_drop'
        alerts.append({
            'id': len(alerts) + 1,
            'type': alert_type,
            'severity': a['severity'],
            'message': f"{'Demand spike' if a['type'] == 'spike' else 'Demand drop'} detected on {a['date']}",
            'details': f"Revenue was ${a['value']:,.2f} vs expected ${a['expected']:,.2f}",
            'timestamp': a['date'],
            'actionable': True
        })
    
    # Add trend alerts
    trend_alerts = generate_trend_alerts(daily_sales)
    for t in trend_alerts:
        alerts.append({
            'id': len(alerts) + 1,
            'type': t['type'],
            'severity': t['severity'],
            'message': t['message'],
            'details': 'Based on 7-day comparison',
            'timestamp': datetime.now().strftime('%Y-%m-%d'),
            'actionable': t['severity'] == 'warning'
        })
    
    # Save alerts
    os.makedirs('models', exist_ok=True)
    with open(ALERTS_PATH, 'w') as f:
        json.dump(alerts, f)
    
    return alerts


def get_alerts() -> List[Dict]:
    """Get generated alerts"""
    if os.path.exists(ALERTS_PATH):
        try:
            with open(ALERTS_PATH, 'r') as f:
                return json.load(f)
        except Exception:
            pass
    
    return generate_sample_alerts()


def generate_sample_alerts() -> List[Dict]:
    """Generate sample alerts for demo"""
    today = datetime.now()
    
    return [
        {
            'id': 1,
            'type': 'demand_spike',
            'severity': 'high',
            'message': 'Unusual demand spike detected for "WHITE HANGING HEART"',
            'details': '300% increase in orders over the last 24 hours',
            'timestamp': (today - timedelta(hours=2)).isoformat(),
            'actionable': True
        },
        {
            'id': 2,
            'type': 'demand_drop',
            'severity': 'medium',
            'message': 'Significant sales drop in Electronics category',
            'details': '45% decrease compared to last week average',
            'timestamp': (today - timedelta(hours=5)).isoformat(),
            'actionable': True
        },
        {
            'id': 3,
            'type': 'trend_up',
            'severity': 'info',
            'message': 'Positive trend detected in Kitchen & Dining',
            'details': 'Consistent 15% week-over-week growth',
            'timestamp': (today - timedelta(days=1)).isoformat(),
            'actionable': False
        },
        {
            'id': 4,
            'type': 'inventory',
            'severity': 'warning',
            'message': 'Low stock prediction for "REGENCY CAKESTAND"',
            'details': 'Based on current velocity, stock will be depleted in 3 days',
            'timestamp': (today - timedelta(days=1)).isoformat(),
            'actionable': True
        },
        {
            'id': 5,
            'type': 'opportunity',
            'severity': 'info',
            'message': 'Bundle opportunity identified',
            'details': '"Party Bunting" and "Cake Stand" are frequently bought together',
            'timestamp': (today - timedelta(days=2)).isoformat(),
            'actionable': True
        }
    ]
