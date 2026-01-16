import React from 'react';
import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    Chip,
    Alert,
    Divider
} from '@mui/material';

// Payment configuration presets
const PAYMENT_PRESETS = {
    'delivery-only': {
        name: 'Delivery Only (Scenario 2)',
        description: 'Platform gets delivery fees only, vendor gets 100% of items',
        model: '2-way',
        platformFee: 0,
        vendorFee: 1.0,
        hotelFee: 0,
        deliveryDestination: 'platform',
        tipDestination: 'platform'
    },
    'standard-5': {
        name: 'Standard 5% Commission (Scenario 1)',
        description: 'Platform gets 5% commission + delivery',
        model: '2-way',
        platformFee: 0.05,
        vendorFee: 0.95,
        hotelFee: 0,
        deliveryDestination: 'platform',
        tipDestination: 'platform'
    },
    'vendor-all': {
        name: 'Vendor Gets Everything (Scenario 3)',
        description: 'Vendor provides own delivery, platform only provides ordering',
        model: '2-way',
        platformFee: 0,
        vendorFee: 1.0,
        hotelFee: 0,
        deliveryDestination: 'vendor',
        tipDestination: 'vendor'
    },
    'cog-based-12': {
        name: 'COG-Based 12% (Scenario 4)',
        description: 'Commission on profit only (after COG)',
        model: 'cog-based',
        platformFee: 0.12,
        vendorFee: 0.88,
        hotelFee: 0,
        deliveryDestination: 'platform',
        tipDestination: 'platform'
    },
    'stadium-partnership': {
        name: 'Stadium Partnership (Scenario 5)',
        description: '3-way split with venue commission',
        model: '3-way',
        platformFee: 0,
        vendorFee: 0.88,
        hotelFee: 0.12,
        deliveryDestination: 'platform',
        tipDestination: 'platform'
    },
    'high-commission': {
        name: 'High Commission 15% (Scenario 8)',
        description: 'Platform provides significant value',
        model: '2-way',
        platformFee: 0.15,
        vendorFee: 0.85,
        hotelFee: 0,
        deliveryDestination: 'platform',
        tipDestination: 'platform'
    }
};

const PaymentOptionsForm = ({ paymentOptions, onChange }) => {
    const handleChange = (field, value) => {
        onChange({
            ...paymentOptions,
            [field]: value
        });
    };

    const applyPreset = (presetKey) => {
        const preset = PAYMENT_PRESETS[presetKey];
        onChange({
            ...paymentOptions,
            model: preset.model,
            platformFee: preset.platformFee,
            vendorFee: preset.vendorFee,
            hotelFee: preset.hotelFee,
            deliveryDestination: preset.deliveryDestination,
            tipDestination: preset.tipDestination
        });
    };

    // Validation
    const totalFees = (paymentOptions.platformFee || 0) +
        (paymentOptions.vendorFee || 0) +
        (paymentOptions.hotelFee || 0);
    const feesValid = Math.abs(totalFees - 1.0) < 0.001;

    return (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#1976d2' }}>
                💳 Payment Configuration
            </Typography>

            {/* Quick Presets */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                    Quick Presets:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(PAYMENT_PRESETS).map(([key, preset]) => (
                        <Chip
                            key={key}
                            label={preset.name}
                            onClick={() => applyPreset(key)}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ cursor: 'pointer' }}
                        />
                    ))}
                </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Payment Model Selection */}
            <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
                <InputLabel>Payment Model</InputLabel>
                <Select
                    value={paymentOptions.model || '2-way'}
                    onChange={(e) => handleChange('model', e.target.value)}
                    label="Payment Model"
                >
                    <MenuItem value="2-way">2-Way Split (Platform + Vendor)</MenuItem>
                    <MenuItem value="cog-based">COG-Based (Commission on Profit)</MenuItem>
                    <MenuItem value="3-way">3-Way Split (Platform + Vendor + Hotel)</MenuItem>
                </Select>
            </FormControl>

            {/* Fee Configuration */}
            <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                Commission Rates (must total 100%):
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 2 }}>
                <TextField
                    margin="dense"
                    label="Platform Fee (%)"
                    type="number"
                    inputProps={{ min: "0", max: "100", step: "0.1" }}
                    value={(paymentOptions.platformFee || 0) * 100}
                    onChange={(e) => handleChange('platformFee', parseFloat(e.target.value) / 100)}
                    helperText={`${((paymentOptions.platformFee || 0) * 100).toFixed(1)}%`}
                />
                <TextField
                    margin="dense"
                    label="Vendor Fee (%)"
                    type="number"
                    inputProps={{ min: "0", max: "100", step: "0.1" }}
                    value={(paymentOptions.vendorFee || 0) * 100}
                    onChange={(e) => handleChange('vendorFee', parseFloat(e.target.value) / 100)}
                    helperText={`${((paymentOptions.vendorFee || 0) * 100).toFixed(1)}%`}
                />
                <TextField
                    margin="dense"
                    label="Hotel Fee (%)"
                    type="number"
                    inputProps={{ min: "0", max: "100", step: "0.1" }}
                    value={(paymentOptions.hotelFee || 0) * 100}
                    onChange={(e) => handleChange('hotelFee', parseFloat(e.target.value) / 100)}
                    helperText={`${((paymentOptions.hotelFee || 0) * 100).toFixed(1)}%`}
                    disabled={paymentOptions.model !== '3-way'}
                />
            </Box>

            {/* Validation Alert */}
            {!feesValid && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Fees must total 100% (currently {(totalFees * 100).toFixed(1)}%)
                </Alert>
            )}

            {/* Delivery & Tip Destinations */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
                <FormControl fullWidth margin="dense">
                    <InputLabel>Delivery Fee Goes To</InputLabel>
                    <Select
                        value={paymentOptions.deliveryDestination || 'platform'}
                        onChange={(e) => handleChange('deliveryDestination', e.target.value)}
                        label="Delivery Fee Goes To"
                    >
                        <MenuItem value="platform">Platform</MenuItem>
                        <MenuItem value="vendor">Vendor</MenuItem>
                        {paymentOptions.model === '3-way' && <MenuItem value="hotel">Hotel</MenuItem>}
                        <MenuItem value="split">Split (Custom)</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth margin="dense">
                    <InputLabel>Tip Goes To</InputLabel>
                    <Select
                        value={paymentOptions.tipDestination || 'platform'}
                        onChange={(e) => handleChange('tipDestination', e.target.value)}
                        label="Tip Goes To"
                    >
                        <MenuItem value="platform">Platform</MenuItem>
                        <MenuItem value="vendor">Vendor</MenuItem>
                        {paymentOptions.model === '3-way' && <MenuItem value="hotel">Hotel</MenuItem>}
                        <MenuItem value="delivery">Delivery Person</MenuItem>
                        <MenuItem value="split">Split (Custom)</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            {/* Delivery Split Configuration (Scenario 7) */}
            {paymentOptions.deliveryDestination === 'split' && (
                <Box sx={{ mb: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                        Delivery Fee Split (must total 100%):
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
                        <TextField
                            margin="dense"
                            label="Platform (%)"
                            type="number"
                            inputProps={{ min: "0", max: "100", step: "1" }}
                            value={((paymentOptions.deliverySplit?.platform || 0) * 100)}
                            onChange={(e) => handleChange('deliverySplit', {
                                ...paymentOptions.deliverySplit,
                                platform: parseFloat(e.target.value) / 100
                            })}
                        />
                        <TextField
                            margin="dense"
                            label="Vendor (%)"
                            type="number"
                            inputProps={{ min: "0", max: "100", step: "1" }}
                            value={((paymentOptions.deliverySplit?.vendor || 0) * 100)}
                            onChange={(e) => handleChange('deliverySplit', {
                                ...paymentOptions.deliverySplit,
                                vendor: parseFloat(e.target.value) / 100
                            })}
                        />
                        {paymentOptions.model === '3-way' && (
                            <TextField
                                margin="dense"
                                label="Hotel (%)"
                                type="number"
                                inputProps={{ min: "0", max: "100", step: "1" }}
                                value={((paymentOptions.deliverySplit?.hotel || 0) * 100)}
                                onChange={(e) => handleChange('deliverySplit', {
                                    ...paymentOptions.deliverySplit,
                                    hotel: parseFloat(e.target.value) / 100
                                })}
                            />
                        )}
                    </Box>
                </Box>
            )}

            {/* Tip Split Configuration (Scenario 7) */}
            {paymentOptions.tipDestination === 'split' && (
                <Box sx={{ mb: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                        Tip Split (must total 100%):
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
                        <TextField
                            margin="dense"
                            label="Platform (%)"
                            type="number"
                            inputProps={{ min: "0", max: "100", step: "1" }}
                            value={((paymentOptions.tipSplit?.platform || 0) * 100)}
                            onChange={(e) => handleChange('tipSplit', {
                                ...paymentOptions.tipSplit,
                                platform: parseFloat(e.target.value) / 100
                            })}
                        />
                        <TextField
                            margin="dense"
                            label="Vendor (%)"
                            type="number"
                            inputProps={{ min: "0", max: "100", step: "1" }}
                            value={((paymentOptions.tipSplit?.vendor || 0) * 100)}
                            onChange={(e) => handleChange('tipSplit', {
                                ...paymentOptions.tipSplit,
                                vendor: parseFloat(e.target.value) / 100
                            })}
                        />
                        {paymentOptions.model === '3-way' && (
                            <TextField
                                margin="dense"
                                label="Hotel (%)"
                                type="number"
                                inputProps={{ min: "0", max: "100", step: "1" }}
                                value={((paymentOptions.tipSplit?.hotel || 0) * 100)}
                                onChange={(e) => handleChange('tipSplit', {
                                    ...paymentOptions.tipSplit,
                                    hotel: parseFloat(e.target.value) / 100
                                })}
                            />
                        )}
                    </Box>
                </Box>
            )}

            {/* Stripe Account IDs */}
            <TextField
                margin="dense"
                label="Vendor Stripe Account ID"
                fullWidth
                value={paymentOptions.vendorId || ''}
                onChange={(e) => handleChange('vendorId', e.target.value)}
                placeholder="acct_vendor123"
                helperText="Stripe Connect account ID for the vendor (required)"
                sx={{ mb: 2 }}
                required
            />

            {paymentOptions.model === '3-way' && (
                <TextField
                    margin="dense"
                    label="Hotel/Venue Stripe Account ID"
                    fullWidth
                    value={paymentOptions.hotelId || ''}
                    onChange={(e) => handleChange('hotelId', e.target.value)}
                    placeholder="acct_hotel456"
                    helperText="Stripe Connect account ID for the hotel/venue (required for 3-way)"
                    required
                />
            )}

            {/* Info Box */}
            <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="caption">
                    <strong>Current Model:</strong> {paymentOptions.model || '2-way'}<br />
                    <strong>Platform:</strong> {((paymentOptions.platformFee || 0) * 100).toFixed(1)}% of items
                    {paymentOptions.deliveryDestination === 'platform' && ' + delivery'}
                    {paymentOptions.tipDestination === 'platform' && ' + tips'}<br />
                    <strong>Vendor:</strong> {((paymentOptions.vendorFee || 0) * 100).toFixed(1)}% of items
                    {paymentOptions.deliveryDestination === 'vendor' && ' + delivery'}
                    {paymentOptions.tipDestination === 'vendor' && ' + tips'}<br />
                    {paymentOptions.model === '3-way' && (
                        <>
                            <strong>Hotel:</strong> {((paymentOptions.hotelFee || 0) * 100).toFixed(1)}% of items
                            {paymentOptions.deliveryDestination === 'hotel' && ' + delivery'}
                            {paymentOptions.tipDestination === 'hotel' && ' + tips'}
                        </>
                    )}
                </Typography>
            </Alert>
        </Box>
    );
};

export default PaymentOptionsForm;
