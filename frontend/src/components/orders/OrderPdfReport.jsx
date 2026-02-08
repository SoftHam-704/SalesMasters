import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// Helper to format CPF/CNPJ
const formatCpfCnpj = (value) => {
    if (!value) return '';
    const cleanValue = String(value).replace(/\D/g, '');
    if (cleanValue.length === 11) {
        return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (cleanValue.length === 14) {
        return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    return value;
};

// Helper to format discount string
const getDiscountString = (o) => {
    if (!o) return '';
    const discs = [];
    for (let i = 1; i <= 10; i++) {
        const val = parseFloat(o[`ped_desc${i}`]);
        if (val > 0) discs.push(`${val.toFixed(2)}%`);
    }
    return discs.join('+');
};

// Model 14: Quick Quote Table - Sq, Prod, Conv, Desc, Quant, Bruto, Liq, Total, IPI
const ItemsModel14 = ({ groupedItems, order }) => {
    let globalSeq = 0;
    const allItems = Object.values(groupedItems).flat();
    const subTotalBruto = allItems.reduce((acc, it) => acc + (parseFloat(it.ite_totbruto) || 0), 0);
    const subTotalLiq = allItems.reduce((acc, it) => acc + (parseFloat(it.ite_totliquido) || 0), 0);

    return (
        <View style={{ marginBottom: 3 }}>
            <View style={{ backgroundColor: '#ffffff', padding: 2, borderBottomWidth: 0.5, borderBottomColor: '#000', borderBottomStyle: 'solid' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 7 }}>
                    Descontos: <Text style={{ fontWeight: 'normal' }}>{getDiscountString(order)}</Text>
                </Text>
            </View>
            <View style={{ ...styles.tableHeader, borderBottomWidth: 0, borderTopWidth: 0 }}>
                <Text style={{ width: '3%', textAlign: 'center' }}>Sq:</Text>
                <Text style={{ width: '7%', textAlign: 'center' }}>Produto:</Text>
                <Text style={{ width: '12%', textAlign: 'center' }}>Cod. orig/Conv./Comp</Text>
                <Text style={{ flex: 1, paddingLeft: 2 }}>Descrição do produto:</Text>
                <Text style={{ width: '5%', textAlign: 'center' }}>Quant</Text>
                <Text style={{ width: '8%', textAlign: 'right' }}>Un.Bruto</Text>
                <Text style={{ width: '8%', textAlign: 'right' }}>Un.liquido</Text>
                <Text style={{ width: '10%', textAlign: 'right' }}>Total lqdo</Text>
                <Text style={{ width: '4%', textAlign: 'right' }}>IPI</Text>
            </View>

            {allItems.map((item, idx) => {
                globalSeq++;
                const conv = item.pro_codigooriginal || item.ite_embuch || '';
                return (
                    <View key={idx} style={styles.tableRowDashed} wrap={false}>
                        <Text style={{ width: '3%', textAlign: 'center' }}>{globalSeq}</Text>
                        <Text style={{ width: '7%', textAlign: 'center' }}>{item.ite_produto}</Text>
                        <Text style={{ width: '12%', textAlign: 'center', fontSize: 6 }}>{conv}</Text>
                        <Text style={{ flex: 1, paddingLeft: 2 }}>{item.ite_nomeprod}</Text>
                        <Text style={{ width: '5%', textAlign: 'center', fontWeight: 'bold' }}>{item.ite_quant}</Text>
                        <Text style={{ width: '8%', textAlign: 'right' }}>{fv(item.ite_puni)}</Text>
                        <Text style={{ width: '8%', textAlign: 'right' }}>{fv(item.ite_puniliq)}</Text>
                        <Text style={{ width: '10%', textAlign: 'right', fontWeight: 'bold' }}>{fv(item.ite_totliquido)}</Text>
                        <Text style={{ width: '4%', textAlign: 'right', fontSize: 6 }}>{fv(item.ite_ipi)}</Text>
                    </View>
                );
            })}

            <View style={{ ...styles.subTotalRow, borderTopWidth: 0.5, marginTop: 2 }}>
                <Text style={{ width: '73%', textAlign: 'left', paddingLeft: 2 }}>Sub-total:</Text>
                <Text style={{ width: '8%', textAlign: 'right' }}>{fv(subTotalBruto)}</Text>
                <Text style={{ width: '8%', textAlign: 'right' }}>{fv(subTotalLiq)}</Text>
                <Text style={{ width: '11%', textAlign: 'right', fontWeight: 'bold' }}>{fv(subTotalLiq)}</Text>
            </View>
        </View>
    );
};

// Model 13: Landscape Table - Sq, Prod, Comp, Nº Ped, Desc, Quant, Bruto, Liq, C/Imp, Total, IPI, ST
const ItemsModel13 = ({ groupedItems }) => {
    let globalSeq = 0;
    const allItems = Object.values(groupedItems).flat();
    const subTotalBruto = allItems.reduce((acc, it) => acc + (parseFloat(it.ite_totbruto) || 0), 0);
    const subTotalLiq = allItems.reduce((acc, it) => acc + (parseFloat(it.ite_totliquido) || 0), 0);
    const subTotalComImpostos = allItems.reduce((acc, it) => acc + (parseFloat(it.ite_totcomst) || parseFloat(it.ite_totalipi) || parseFloat(it.ite_totliquido) || 0), 0);

    return (
        <View style={{ marginBottom: 3 }}>
            <View style={{ backgroundColor: '#64748b', padding: 2, borderBottomWidth: 0.5, borderBottomColor: '#000', borderBottomStyle: 'solid' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 7, color: '#ffffff' }}>
                    Descontos: 78.00%+10.00%+10.00%+10.00%+10.00%
                </Text>
            </View>
            <View style={{ ...styles.tableHeader, backgroundColor: '#64748b', color: '#ffffff', borderBottomWidth: 0 }}>
                <Text style={{ width: '3%', textAlign: 'center' }}>Sq:</Text>
                <Text style={{ width: '6%', textAlign: 'center' }}>Produto:</Text>
                <Text style={{ width: '8%', textAlign: 'center' }}>Complemento</Text>
                <Text style={{ width: '8%', textAlign: 'center' }}>Nº pedido</Text>
                <Text style={{ flex: 1, paddingLeft: 2 }}>Descrição do produto:</Text>
                <Text style={{ width: '4%', textAlign: 'center' }}>Quant</Text>
                <Text style={{ width: '7%', textAlign: 'right' }}>Bruto</Text>
                <Text style={{ width: '7%', textAlign: 'right' }}>Líquido</Text>
                <Text style={{ width: '7%', textAlign: 'right' }}>C/Imposto</Text>
                <Text style={{ width: '7%', textAlign: 'right' }}>Total</Text>
                <Text style={{ width: '3%', textAlign: 'right' }}>IPI</Text>
                <Text style={{ width: '3%', textAlign: 'right' }}>ST</Text>
            </View>

            {allItems.map((item, idx) => {
                globalSeq++;
                const comp = item.pro_codigooriginal || '';
                const unitComImpostos = parseFloat(item.ite_valcomst) || parseFloat(item.ite_valcomipi) || parseFloat(item.ite_puniliq);
                const totComImpostos = parseFloat(item.ite_totcomst) || parseFloat(item.ite_totalipi) || parseFloat(item.ite_totliquido);

                return (
                    <View key={idx} style={{ ...styles.tableRowDashed, borderBottomColor: '#cbd5e1' }} wrap={false}>
                        <Text style={{ width: '3%', textAlign: 'center' }}>{globalSeq}</Text>
                        <Text style={{ width: '6%', textAlign: 'center', color: '#1e40af', fontWeight: 'bold' }}>{item.ite_produto}</Text>
                        <Text style={{ width: '8%', textAlign: 'center', fontSize: 6 }}>{comp}</Text>
                        <Text style={{ width: '8%', textAlign: 'center', fontSize: 6 }}></Text>
                        <Text style={{ flex: 1, paddingLeft: 2, color: '#1e40af', fontWeight: 'bold' }}>{item.ite_nomeprod}</Text>
                        <Text style={{ width: '4%', textAlign: 'center', fontWeight: 'bold', color: '#1e40af' }}>{item.ite_quant}</Text>
                        <Text style={{ width: '7%', textAlign: 'right' }}>{fv(item.ite_puni)}</Text>
                        <Text style={{ width: '7%', textAlign: 'right' }}>{fv(item.ite_puniliq)}</Text>
                        <Text style={{ width: '7%', textAlign: 'right' }}>{fv(unitComImpostos)}</Text>
                        <Text style={{ width: '7%', textAlign: 'right', fontWeight: 'bold' }}>{fv(totComImpostos)}</Text>
                        <Text style={{ width: '3%', textAlign: 'right', fontSize: 5 }}>{fv(item.ite_ipi)}</Text>
                        <Text style={{ width: '3%', textAlign: 'right', fontSize: 5 }}>{fv(item.ite_st)}</Text>
                    </View>
                );
            })}

            <View style={{ flexDirection: 'row', borderTopWidth: 0.5, marginTop: 2 }}>
                <Text style={{ width: '68%' }}></Text>
                <Text style={{ width: '7%', textAlign: 'right', fontWeight: 'bold' }}>{fv(subTotalBruto)}</Text>
                <Text style={{ width: '7%', textAlign: 'right', fontWeight: 'bold' }}>{fv(subTotalLiq)}</Text>
                <Text style={{ width: '7%', textAlign: 'right', fontWeight: 'bold' }}>{fv(subTotalComImpostos)}</Text>
                <Text style={{ width: '7%', textAlign: 'right', fontWeight: 'bold' }}>{fv(subTotalComImpostos)}</Text>
            </View>
        </View>
    );
};

// Model 12: Specific Calculations per Item - Sq, Prod, Desc, Quant, Un.Bruto, Un.Liq, Unit c/IPI e ST, Total c/IPI e ST, IPI, ST
const ItemsModel12 = ({ groupedItems }) => {
    let globalSeq = 0;
    const allItems = Object.values(groupedItems).flat();
    const subTotalBruto = allItems.reduce((acc, it) => acc + (parseFloat(it.ite_totbruto) || 0), 0);
    const subTotalLiq = allItems.reduce((acc, it) => acc + (parseFloat(it.ite_totliquido) || 0), 0);
    const subTotalComImpostos = allItems.reduce((acc, it) => acc + (parseFloat(it.ite_totcomst) || parseFloat(it.ite_totalipi) || parseFloat(it.ite_totliquido) || 0), 0);

    return (
        <View style={{ marginBottom: 3 }}>
            <View style={{ backgroundColor: '#ffffff', padding: 2, borderBottomWidth: 0.5, borderBottomColor: '#000', borderBottomStyle: 'solid' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 7 }}>
                    Descontos: <Text style={{ fontWeight: 'normal' }}>78.00%+10.00%+10.00%+10.00%+10.00%</Text>
                </Text>
            </View>
            <View style={{ ...styles.tableHeader, borderBottomWidth: 0 }}>
                <Text style={{ width: '3%', textAlign: 'center' }}>Sq:</Text>
                <Text style={{ width: '7%', textAlign: 'center' }}>Produto:</Text>
                <Text style={{ flex: 1, paddingLeft: 2 }}>Descrição do produto:</Text>
                <Text style={{ width: '5%', textAlign: 'center' }}>Quant</Text>
                <Text style={{ width: '8%', textAlign: 'right' }}>Un.Bruto</Text>
                <Text style={{ width: '8%', textAlign: 'right' }}>Un.liquido</Text>
                <Text style={{ width: '10%', textAlign: 'right' }}>Unit. c/IPI e ST</Text>
                <Text style={{ width: '10%', textAlign: 'right' }}>Tot c/IPI e ST</Text>
                <Text style={{ width: '4%', textAlign: 'right' }}>IPI</Text>
                <Text style={{ width: '4%', textAlign: 'right' }}>ST</Text>
            </View>

            {allItems.map((item, idx) => {
                globalSeq++;
                const unitComImpostos = parseFloat(item.ite_valcomst) || parseFloat(item.ite_valcomipi) || parseFloat(item.ite_puniliq);
                const totComImpostos = parseFloat(item.ite_totcomst) || parseFloat(item.ite_totalipi) || parseFloat(item.ite_totliquido);

                return (
                    <View key={idx} style={styles.tableRowDashed} wrap={false}>
                        <Text style={{ width: '3%', textAlign: 'center' }}>{globalSeq}</Text>
                        <Text style={{ width: '7%', textAlign: 'center' }}>{item.ite_produto}</Text>
                        <Text style={{ flex: 1, paddingLeft: 2 }}>{item.ite_nomeprod}</Text>
                        <Text style={{ width: '5%', textAlign: 'center', fontWeight: 'bold' }}>{item.ite_quant}</Text>
                        <Text style={{ width: '8%', textAlign: 'right' }}>{fv(item.ite_puni)}</Text>
                        <Text style={{ width: '8%', textAlign: 'right' }}>{fv(item.ite_puniliq)}</Text>
                        <Text style={{ width: '10%', textAlign: 'right' }}>{fv(unitComImpostos)}</Text>
                        <Text style={{ width: '10%', textAlign: 'right', fontWeight: 'bold' }}>{fv(totComImpostos)}</Text>
                        <Text style={{ width: '4%', textAlign: 'right', fontSize: 6 }}>{fv(item.ite_ipi)}</Text>
                        <Text style={{ width: '4%', textAlign: 'right', fontSize: 6 }}>{fv(item.ite_st)}</Text>
                    </View>
                );
            })}

            <View style={{ ...styles.subTotalRow, borderTopWidth: 0.5, marginTop: 2 }}>
                <Text style={{ width: '64%' }}></Text>
                <Text style={{ width: '8%', textAlign: 'right' }}>{fv(subTotalBruto)}</Text>
                <Text style={{ width: '8%', textAlign: 'right' }}>{fv(subTotalLiq)}</Text>
                <Text style={{ width: '10%', textAlign: 'right' }}>{fv(subTotalComImpostos)}</Text>
                <Text style={{ width: '10%', textAlign: 'right' }}>{fv(subTotalComImpostos)}</Text>
            </View>
        </View>
    );
};

// Model 11: Light Table - Sq, Prod, Conv/Comp, Desc, Quant, Un.Bruto, Un.Liq, Total, IPI
const ItemsModel11 = ({ groupedItems }) => {
    let globalSeq = 0;
    const allItems = Object.values(groupedItems).flat();
    const subTotalBruto = allItems.reduce((acc, it) => acc + (parseFloat(it.ite_totbruto) || 0), 0);
    const subTotalLiq = allItems.reduce((acc, it) => acc + (parseFloat(it.ite_totliquido) || 0), 0);

    return (
        <View style={{ marginBottom: 3 }}>
            <View style={{ backgroundColor: '#ffffff', padding: 2, borderBottomWidth: 0.5, borderBottomColor: '#000', borderBottomStyle: 'solid' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 7 }}>
                    Descontos: <Text style={{ fontWeight: 'normal' }}>78.00%+10.00%+10.00%+10.00%+10.00%</Text>
                </Text>
            </View>
            <View style={{ ...styles.tableHeader, borderBottomWidth: 0 }}>
                <Text style={{ width: '3%', textAlign: 'center' }}>Sq:</Text>
                <Text style={{ width: '8%', textAlign: 'center' }}>Produto:</Text>
                <Text style={{ width: '12%', textAlign: 'center' }}>Cod.orig/Conv./Comp</Text>
                <Text style={{ flex: 1, paddingLeft: 2 }}>Descrição do produto:</Text>
                <Text style={{ width: '6%', textAlign: 'center' }}>Quant</Text>
                <Text style={{ width: '8%', textAlign: 'right' }}>Un.Bruto</Text>
                <Text style={{ width: '8%', textAlign: 'right' }}>Un.liquido</Text>
                <Text style={{ width: '10%', textAlign: 'right' }}>Total lqdo</Text>
                <Text style={{ width: '4%', textAlign: 'right' }}>IPI</Text>
            </View>

            {allItems.map((item, idx) => {
                globalSeq++;
                const conv = item.pro_codigooriginal || item.ite_embuch || '';
                return (
                    <View key={idx} style={styles.tableRowDashed} wrap={false}>
                        <Text style={{ width: '3%', textAlign: 'center' }}>{globalSeq}</Text>
                        <Text style={{ width: '8%', textAlign: 'center' }}>{item.ite_produto}</Text>
                        <Text style={{ width: '12%', textAlign: 'center', fontSize: 6 }}>{conv}</Text>
                        <Text style={{ flex: 1, paddingLeft: 2 }}>{item.ite_nomeprod}</Text>
                        <Text style={{ width: '6%', textAlign: 'center', fontWeight: 'bold' }}>{item.ite_quant}</Text>
                        <Text style={{ width: '8%', textAlign: 'right' }}>{fv(item.ite_puni)}</Text>
                        <Text style={{ width: '8%', textAlign: 'right' }}>{fv(item.ite_puniliq)}</Text>
                        <Text style={{ width: '10%', textAlign: 'right', fontWeight: 'bold' }}>{fv(item.ite_totliquido)}</Text>
                        <Text style={{ width: '4%', textAlign: 'right', fontSize: 6 }}>{fv(item.ite_ipi)}</Text>
                    </View>
                );
            })}

            <View style={{ ...styles.subTotalRow, borderTopWidth: 0.5, marginTop: 2 }}>
                <Text style={{ width: '70%', textAlign: 'left', paddingLeft: 2 }}>Sub-total:</Text>
                <Text style={{ width: '8%', textAlign: 'right' }}>{fv(subTotalBruto)}</Text>
                <Text style={{ width: '8%', textAlign: 'right' }}>{fv(subTotalLiq)}</Text>
                <Text style={{ width: '10%', textAlign: 'right', fontWeight: 'bold' }}>{fv(subTotalLiq)}</Text>
                <Text style={{ width: '4%' }}></Text>
            </View>
        </View>
    );
};

// Model 10: Simple Table - Sq, Quant, Prod, Desc, Un.Liq, Total, IPI
const ItemsModel10 = ({ groupedItems }) => {
    let globalSeq = 0;
    const allItems = Object.values(groupedItems).flat();
    const subTotalLiq = allItems.reduce((acc, it) => acc + (parseFloat(it.ite_totliquido) || 0), 0);

    return (
        <View style={{ marginBottom: 3 }}>
            <View style={styles.tableHeader}>
                <Text style={{ width: '4%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' }}>Sq:</Text>
                <Text style={{ width: '5%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' }}>Quant:</Text>
                <Text style={{ width: '8%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' }}>Produto:</Text>
                <Text style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingLeft: 2 }}>Descrição do produto:</Text>
                <Text style={{ width: '12%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>Un.líquido:</Text>
                <Text style={{ width: '12%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>Total liqdo:</Text>
                <Text style={{ width: '5%', textAlign: 'right', paddingRight: 2 }}>IPI:</Text>
            </View>

            {allItems.map((item, idx) => {
                globalSeq++;
                return (
                    <View key={idx} style={{ ...styles.tableRow, flexDirection: 'column' }} wrap={false}>
                        <View style={{ flexDirection: 'row' }}>
                            <Text style={{ width: '4%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' }}>{globalSeq}</Text>
                            <Text style={{ width: '5%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' }}>{item.ite_quant}</Text>
                            <Text style={{ width: '8%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' }}>{item.ite_produto}</Text>
                            <Text style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingLeft: 2 }}>{item.ite_nomeprod}</Text>
                            <Text style={{ width: '12%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>{fv(item.ite_puniliq)}</Text>
                            <Text style={{ width: '12%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2, fontWeight: 'bold' }}>{fv(item.ite_totliquido)}</Text>
                            <Text style={{ width: '5%', textAlign: 'right', paddingRight: 2 }}>{fv(item.ite_ipi)}</Text>
                        </View>
                        {item.pro_aplicacao && (
                            <View style={{ paddingLeft: '17%', paddingBottom: 2 }}>
                                <Text style={{ fontSize: 7, color: '#4b5563' }}>{item.pro_aplicacao}</Text>
                            </View>
                        )}
                    </View>
                );
            })}

            <View style={styles.subTotalRow}>
                <Text style={{ ...styles.label, width: '71%', paddingLeft: 2 }}>Sub-total:</Text>
                <Text style={{ width: '12%', textAlign: 'right', paddingRight: 2 }}>{fv(subTotalLiq)}</Text>
                <Text style={{ width: '12%', textAlign: 'right', paddingRight: 2 }}>{fv(subTotalLiq)}</Text>
                <Text style={{ width: '5%' }}></Text>
            </View>
        </View>
    );
};

// ============================================================================
// STYLES - Shared styles for all report models
// ============================================================================
const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontSize: 8,
        fontFamily: 'Helvetica',
        color: '#334155',
    },
    // Header Section
    header: {
        flexDirection: 'row',
        borderWidth: 0.5,
        borderColor: '#94a3b8',
        borderStyle: 'solid',
        padding: 5,
        marginBottom: 3,
        alignItems: 'center',
    },
    logoBox: {
        width: 60,
        height: 35,
        borderWidth: 0.5,
        borderColor: '#cbd5e1',
        borderStyle: 'solid',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    companyInfo: {
        flex: 1,
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    companyName: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    industryBar: {
        backgroundColor: '#1e40af',
        color: 'white',
        textAlign: 'center',
        padding: 2,
        fontWeight: 'bold',
        fontSize: 9,
        marginBottom: 3,
    },
    // Grid & Layout
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderWidth: 0.5,
        borderColor: '#94a3b8',
        borderStyle: 'solid',
        padding: 3,
        marginBottom: 3,
    },
    gridRow: {
        flexDirection: 'row',
        marginBottom: 1,
    },
    // Labels & Values
    label: {
        color: '#64748b',
        fontSize: 7,
    },
    value: {
        fontWeight: 'bold',
        fontSize: 8,
    },
    redLabel: {
        color: '#dc2626',
    },
    // Section Containers
    sectionTitle: {
        backgroundColor: '#e2e8f0',
        borderWidth: 0.5,
        borderColor: '#94a3b8',
        borderStyle: 'solid',
        textAlign: 'center',
        fontWeight: 'bold',
        padding: 1,
        fontSize: 8,
    },
    sectionContent: {
        borderWidth: 0.5,
        borderColor: '#94a3b8',
        borderStyle: 'solid',
        borderTopWidth: 0,
        padding: 3,
        marginBottom: 3,
    },
    // Table Styles
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#e2e8f0',
        borderWidth: 0.5,
        borderColor: '#94a3b8',
        borderStyle: 'solid',
        fontWeight: 'bold',
        fontSize: 7,
    },
    tableRow: {
        flexDirection: 'row',
        borderLeftWidth: 0.5,
        borderLeftColor: '#94a3b8',
        borderLeftStyle: 'solid',
        borderRightWidth: 0.5,
        borderRightColor: '#94a3b8',
        borderRightStyle: 'solid',
        borderBottomWidth: 0.5,
        borderBottomColor: '#cbd5e1',
        borderBottomStyle: 'solid',
        fontSize: 8,
    },
    subTotalRow: {
        flexDirection: 'row',
        borderTopWidth: 0.5,
        borderTopColor: '#000000',
        borderTopStyle: 'solid',
        paddingVertical: 2,
        fontWeight: 'bold',
        fontSize: 7,
    },
    // Model 11 specific
    tableRowDashed: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#94a3b8',
        borderBottomStyle: 'dashed',
        paddingVertical: 3,
        minHeight: 18,
    },
    centeredSectionTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: '#f1f5f9',
        padding: 3,
        borderWidth: 0.5,
        borderColor: '#000000',
        borderStyle: 'solid',
        marginTop: 6,
        marginBottom: 1,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionContentModel11: {
        borderWidth: 0.5,
        borderColor: '#000000',
        borderStyle: 'solid',
        padding: 4,
        marginBottom: 4,
    },
    // Column definitions - Standard
    colSq: { width: '3.5%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' },
    colQtd: { width: '5%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' },
    colProd: { width: '10%', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingLeft: 2 },
    colRef: { width: '12%', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingLeft: 2 },
    colDesc: { flex: 1, borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingLeft: 2 },
    colVal: { width: '8%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 },
    colTot: { width: '10%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 },
    colTax: { width: '5%', textAlign: 'right', paddingRight: 2 },
    // Column definitions - With Complement/Conversion
    colComp: { width: '8%', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingLeft: 2 },
    colConv: { width: '6%', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingLeft: 2 },
    // Column definitions - Model 3 (F3)
    colQuant3: { width: '5%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' },
    colProd3: { width: '8%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' },
    colComp3: { width: '10%', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingLeft: 2 },
    colConv3: { width: '10%', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingLeft: 2 },
    colDesc3: { flex: 1, borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingLeft: 2 },
    colLiq3: { width: '10%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 },
    colTotLiq3: { width: '10%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 },
    colIpi3: { width: '6%', textAlign: 'right', paddingRight: 2 },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 10,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontSize: 7,
        color: '#94a3b8',
        borderTopWidth: 0.5,
        borderTopColor: '#e2e8f0',
        borderTopStyle: 'solid',
        paddingTop: 3,
    },
    // Model 5 specific
    totalsTable: {
        flexDirection: 'column',
        marginTop: 5,
        borderWidth: 0.5,
        borderColor: '#000000',
        borderStyle: 'solid',
    },
    totalsTableHeader: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000000',
        borderBottomStyle: 'solid',
    },
    totalsTableCellHeader: {
        flex: 1,
        textAlign: 'center',
        fontSize: 7,
        fontWeight: 'bold',
        padding: 2,
        borderRightWidth: 0.5,
        borderRightColor: '#000000',
        borderRightStyle: 'solid',
        color: '#dc2626',
    },
    totalsTableRow: {
        flexDirection: 'row',
    },
    totalsTableCellValue: {
        flex: 1,
        textAlign: 'center',
        fontSize: 9,
        fontWeight: 'bold',
        padding: 3,
        borderRightWidth: 0.5,
        borderRightColor: '#000000',
        borderRightStyle: 'solid',
    },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Format currency value
const fv = (val) => {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Format date
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
};

// Format currency with 3 decimal places (Model 8)
const fv3 = (val) => {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
};

// Group items by discount key
const groupItemsByDiscount = (items) => {
    const groups = {};
    (items || []).forEach(item => {
        const key = item.ite_descontos || 'Sem desconto';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    });
    return groups;
};

// ============================================================================
// SUB-COMPONENTS - Reusable sections
// ============================================================================

// Header with logo and company info - Supports Model 2 (Cotação) with industry logo
// Header with specific layout: Logos Top, Order Info Bar Below
const ReportHeader = ({ order, repInfo, logo, industryLogo, modelNum = 1 }) => {
    const isCotacao = modelNum === 2;
    const titulo = isCotacao ? 'Cotação' : 'Pedido';
    const repEnderecoCompleto = `${repInfo?.rep_endereco || ''} ${repInfo?.rep_bairro || ''}`;
    const repCidadeInfo = `${repInfo?.rep_cidade || ''} ${repInfo?.rep_uf ? `UF: ${repInfo.rep_uf}` : ''} ${repInfo?.rep_cep ? `CEP: ${repInfo.rep_cep}` : ''}`;

    // Visual helper: Cotação title in red to distinguish from Order
    const titleStyle = isCotacao ? { color: '#dc2626' } : { color: '#000000' };

    return (
        <View style={{ marginBottom: 2 }}>
            <View style={{ borderWidth: 0.5, borderColor: '#000000', borderStyle: 'solid', borderBottomWidth: 0 }}>
                {/* Top Section: Logos and Company Info */}
                <View style={{ flexDirection: 'row', padding: 5, minHeight: 60, alignItems: 'center' }}>
                    {/* Left: Rep Logo */}
                    <View style={{ width: 80, alignItems: 'center', justifyContent: 'center' }}>
                        {logo ? (
                            <Image src={logo} style={{ maxWidth: 75, maxHeight: 50 }} />
                        ) : (
                            <Text style={{ fontSize: 6, color: '#94a3b8' }}>LOGO REP</Text>
                        )}
                    </View>

                    {/* Center: Rep Info */}
                    <View style={{ flex: 1, paddingHorizontal: 5, justifyContent: 'center', alignItems: (modelNum === 5 || modelNum === 10 || modelNum === 11 || modelNum === 12 || modelNum === 13) ? 'center' : 'flex-start' }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 }}>{repInfo?.rep_nome || 'SOFT HOUSE SISTEMAS'}</Text>
                        {(modelNum === 5 || modelNum === 10 || modelNum === 11 || modelNum === 12 || modelNum === 13) && repInfo?.rep_cnpj && <Text style={{ fontSize: 8 }}>CNPJ: {repInfo.rep_cnpj}</Text>}
                        <Text style={{ fontSize: 8 }}>{(modelNum === 5 || modelNum === 10 || modelNum === 11 || modelNum === 12 || modelNum === 13) ? `End: ${repEnderecoCompleto}` : repEnderecoCompleto}</Text>
                        <Text style={{ fontSize: 8 }}>{(modelNum === 5 || modelNum === 10 || modelNum === 11 || modelNum === 12 || modelNum === 13) ? `Fones: ${repInfo?.rep_fone || ''}` : repCidadeInfo}</Text>
                        {(modelNum === 5 || modelNum === 10 || modelNum === 11 || modelNum === 12 || modelNum === 13) && <Text style={{ fontSize: 8 }}>E-mail: /</Text>}
                    </View>

                    {/* Right: Industry Logo */}
                    <View style={{ width: '20%', alignItems: 'flex-end', justifyContent: 'center' }}>
                        {industryLogo ? (
                            <Image src={industryLogo} style={{ width: 80, height: 40, objectFit: 'contain' }} />
                        ) : (
                            <View style={{ width: 80, height: 40, backgroundColor: '#f1f5f9', borderWidth: 0.5, borderColor: '#94a3b8', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ fontSize: 6, color: '#94a3b8' }}>LOGO</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Model 11, 12, 13 and 14 Top Info Expansion */}
                {[11, 12, 13, 14].includes(modelNum) && (
                    <View style={{ borderTopWidth: 0.5, borderTopColor: '#000', borderTopStyle: 'solid', paddingTop: 2, flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: '#ccc', borderRightStyle: 'solid', paddingLeft: 2 }}>
                            <View style={{ flexDirection: 'row' }}><Text style={styles.label}>Cotação nº: </Text><Text style={styles.value}>{order.ped_pedido}</Text></View>
                            <View style={{ flexDirection: 'row' }}><Text style={styles.label}>Data: </Text><Text style={styles.value}>{formatDate(order.ped_data)}</Text></View>
                        </View>
                        <View style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: '#ccc', borderRightStyle: 'solid', paddingLeft: 5 }}>
                            <View style={{ flexDirection: 'row' }}><Text style={styles.label}>Nº pedido cliente: </Text><Text style={styles.value}>{order.ped_pedcli || ''}</Text></View>
                            <View style={{ flexDirection: 'row' }}><Text style={styles.label}>Cond. Pagamento: </Text><Text style={{ ...styles.value, color: '#dc2626' }}>{order.order_payment_type || order.ped_condpag || ''}</Text></View>
                        </View>
                        <View style={{ flex: 0.8, borderRightWidth: 0.5, borderRightColor: '#ccc', borderRightStyle: 'solid', paddingLeft: 5 }}>
                            <View style={{ flexDirection: 'row' }}><Text style={styles.label}>Lista: </Text><Text style={{ ...styles.value, fontWeight: 'bold' }}>LISTA ATUAL</Text></View>
                            <View style={{ flexDirection: 'row' }}><Text style={styles.label}>Frete: </Text><Text style={{ ...styles.value, color: '#dc2626', fontWeight: 'bold', textDecoration: 'underline' }}>{order.ped_tipofrete === 'C' ? 'FRETE CIF' : 'FRETE FOB'}</Text></View>
                        </View>
                        {modelNum !== 14 && (
                            <View style={{ flex: 1, paddingLeft: 5 }}>
                                <Text style={{ ...styles.label, textAlign: 'center' }}>Vendedor</Text>
                                <Text style={{ ...styles.value, color: '#dc2626', fontWeight: 'bold', textAlign: 'center' }}>{order.ven_nome || ''}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Info Bar (Only for models that don't use expansions) */}
                {![11, 12, 13, 14].includes(modelNum) && (
                    <View style={{ flexDirection: 'row', borderWidth: 0.5, borderColor: '#000000', borderStyle: 'solid', padding: 3, backgroundColor: '#ffffff', alignItems: 'center' }}>
                        <View style={{ width: '30%' }}>
                            <Text style={{ fontSize: 9, fontWeight: 'bold', ...titleStyle }}>{titulo} nº: {order.ped_pedido}</Text>
                        </View>
                        <View style={{ width: '40%', alignItems: 'center' }}>
                            <Text style={{ fontSize: 9 }}>Pedido cliente nº: <Text style={{ fontWeight: 'bold' }}>{order.ped_pedcli || ''}</Text></Text>
                        </View>
                        <View style={{ width: '30%', alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Data: {formatDate(order.ped_data)}</Text>
                        </View>
                    </View>
                )}

                {/* Model 11 and 12 extra info below header */}
                {(modelNum === 11 || modelNum === 12) && (
                    <View style={{ marginTop: 2, padding: 3, borderWidth: 0.5, borderColor: '#94a3b8', borderStyle: 'solid' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={styles.label}>Cotação nº: </Text>
                                <Text style={styles.value}>{order.ped_pedido || ''}</Text>
                            </View>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={styles.label}>Nº pedido cliente: </Text>
                                <Text style={styles.value}>{order.ped_pedcli || ''}</Text>
                            </View>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={styles.label}>Lista: </Text>
                                <Text style={{ ...styles.value, fontWeight: 'bold', textDecoration: 'underline' }}>LISTA ATUAL</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={styles.label}>Data: </Text>
                                <Text style={styles.value}>{formatDate(order.ped_data)}</Text>
                            </View>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={styles.label}>Cond. Pagamento: </Text>
                                <Text style={{ ...styles.value, color: '#dc2626', fontWeight: 'bold' }}>{order.order_payment_type || order.ped_condpag || ''}</Text>
                            </View>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={styles.label}>Frete: </Text>
                                <Text style={{ ...styles.value, color: '#dc2626', fontWeight: 'bold' }}>{order.ped_tipofrete === 'C' ? 'FRETE CIF' : 'FRETE FOB'}</Text>
                            </View>
                        </View>
                    </View>
                )}

            </View>
        </View>
    );
};

// Industry bar
// Industry bar - Disabled to match Delphi layout (contained in ClientSection)
const IndustryBar = () => null;

// Client info section
// Client info section
const ClientSection = ({ order, hideTitle = false, noBorder = false, modelNum = 1 }) => {
    // Definindo estilo base sem bordas
    const baseStyle = {
        marginTop: 2,
        marginBottom: noBorder ? 0 : 3,
        padding: noBorder ? 0 : 3
    };

    // Adicionando bordas explícitas se não for noBorder
    const containerStyle = noBorder ? baseStyle : {
        ...baseStyle,
        borderWidth: 0.5,
        borderColor: '#94a3b8',
        borderStyle: 'solid'
    };

    // Quando noBorder é true, queremos remover completamente as bordas e padding do conteúdo interno
    // para que ele se ajuste perfeitamente ao container externo (sectionContentModel11)
    const contentStyle = noBorder ? { padding: 0 } : styles.sectionContent;

    return (
        <View style={containerStyle}>
            {!hideTitle && (
                <View style={{ ...styles.sectionTitle, backgroundColor: '#ffffff', borderBottomWidth: 0, justifyContent: 'center' }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 7, textAlign: 'center' }}>DADOS DO CLIENTE</Text>
                </View>
            )}
            <View style={contentStyle}>
                {/* Indústria */}
                <View style={styles.gridRow}>
                    <View style={{ flex: 1 }}><Text style={styles.label}>Indústria:</Text><Text style={styles.value}>{order.for_nome || ''}</Text></View>
                </View>
                {/* Razão Social */}
                <View style={styles.gridRow}>
                    <View style={{ flex: 1 }}><Text style={styles.label}>Razão social:</Text><Text style={styles.value}>{order.cli_nome || ''}</Text></View>
                </View>
                {/* Endereço */}
                <View style={styles.gridRow}>
                    <View style={{ flex: 1 }}><Text style={styles.label}>Endereço:</Text><Text style={styles.value}>{order.cli_endereco || ''}</Text></View>
                </View>
                {/* Complemento */}
                <View style={styles.gridRow}>
                    <View style={{ flex: 1 }}><Text style={styles.label}>Complemento:</Text><Text style={styles.value}>{order.cli_complemento || ''}</Text></View>
                </View>
                {/* Bairro e Cidade */}
                <View style={styles.gridRow}>
                    <View style={{ flex: 0.5 }}><Text style={styles.label}>Bairro:</Text><Text style={styles.value}>{order.cli_bairro || ''}</Text></View>
                    <View style={{ flex: 1 }}><Text style={styles.label}>Cidade:</Text><Text style={styles.value}>{order.cli_cidade || ''}</Text></View>
                </View>
                {/* Cep e Estado */}
                <View style={styles.gridRow}>
                    <View style={{ flex: 0.5 }}><Text style={styles.label}>Cep:</Text><Text style={styles.value}>{order.cli_cep || ''}</Text></View>
                    <View style={{ flex: 0.3 }}><Text style={styles.label}>Estado:</Text><Text style={styles.value}>{order.cli_uf || ''}</Text></View>
                </View>
                {/* CNPJ e Inscrição */}
                <View style={styles.gridRow}>
                    <View style={{ flex: 1 }}><Text style={styles.label}>CNPJ:</Text><Text style={styles.value}>{formatCpfCnpj(order.client_cnpj || order.cli_cnpj || order.cli_cgc)}</Text></View>
                    <View style={{ flex: 1 }}><Text style={styles.label}>Inscrição:</Text><Text style={styles.value}>{order.cli_inscricao || ''}</Text></View>
                </View>
                {/* Fone e Fax */}
                <View style={styles.gridRow}>
                    <View style={{ flex: 1 }}><Text style={styles.label}>Fone:</Text><Text style={styles.value}>{order.cli_fone || ''}</Text></View>
                    <View style={{ flex: 1 }}><Text style={styles.label}>Fax:</Text><Text style={styles.value}>{order.cli_fax || ''}</Text></View>
                </View>
                {/* Comprador e E-Mail */}
                <View style={styles.gridRow}>
                    <View style={{ flex: 0.5 }}><Text style={styles.label}>Comprador:</Text><Text style={styles.value}>{order.ped_comprador || ''}</Text></View>
                    <View style={{ flex: 1 }}><Text style={styles.label}>E-Mail:</Text><Text style={{ ...styles.value, textTransform: 'lowercase' }}>{order.ped_emailcomp || order.cli_email || ''}</Text></View>
                </View>
                {/* E-Mail NFe e Cx. Postal */}
                <View style={styles.gridRow}>
                    <View style={{ flex: 1 }}><Text style={styles.label}>E-Mail NFe:</Text><Text style={{ ...styles.value, textTransform: 'lowercase' }}>{order.cli_emailnfe || order.cli_email || ''}</Text></View>
                    <View style={{ flex: 0.5 }}><Text style={styles.label}>Cx. Postal:</Text><Text style={styles.value}>{order.cli_cxpostal || ''}</Text></View>
                </View>
                {/* Suframa */}
                <View style={styles.gridRow}>
                    <View style={{ flex: 1 }}><Text style={styles.label}>Suframa:</Text><Text style={styles.value}>{order.cli_suframa || ''}</Text></View>
                </View>
                {/* Condições pgto e Frete - Hidden for Model 11 and 12 as they are in the header box */}
                {modelNum !== 11 && modelNum !== 12 && (
                    <View style={styles.gridRow}>
                        <View style={{ flex: 1 }}><Text style={styles.label}>Condições pgto:</Text><Text style={styles.value}>{order.order_payment_type || order.ped_condpag || order.ped_conpgto || ''}</Text></View>
                        <View style={{ flex: 0.5 }}><Text style={styles.label}>Frete:</Text><Text style={{ ...styles.value, ...styles.redLabel }}>{order.ped_tipofrete === 'C' ? 'CIF' : order.ped_tipofrete === 'F' ? 'FOB' : order.ped_tipofrete || ''}</Text></View>
                    </View>
                )}
            </View>
        </View>
    );
};

// Commercial data section
const CommercialSection = ({ order }) => (
    <View style={{ marginBottom: 3 }}>
        <View style={{ ...styles.sectionTitle, backgroundColor: '#ffffff', borderBottomWidth: 0, justifyContent: 'center' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 7, textAlign: 'center' }}>DADOS COMERCIAIS</Text>
        </View>
        <View style={styles.sectionContent}>
            <View style={styles.gridRow}>
                <View style={{ flex: 1 }}><Text style={styles.label}>Vendedor:</Text><Text style={styles.value}>{order.ven_nome || ''}</Text></View>
                <View style={{ flex: 1 }}><Text style={styles.label}>Cond. Pagto:</Text><Text style={styles.value}>{order.ped_conpgto || ''}</Text></View>
                <View style={{ flex: 0.5 }}><Text style={styles.label}>Frete:</Text><Text style={styles.value}>{order.ped_tipofrete === 'C' ? 'CIF' : order.ped_tipofrete === 'F' ? 'FOB' : order.ped_tipofrete || ''}</Text></View>
            </View>
            <View style={styles.gridRow}>
                <View style={{ flex: 1 }}><Text style={styles.label}>Comprador:</Text><Text style={styles.value}>{order.ped_comprador || ''}</Text></View>
                <View style={{ flex: 1.5 }}><Text style={styles.label}>E-Mail:</Text><Text style={{ ...styles.value, textTransform: 'lowercase' }}>{order.ped_emailcomp || ''}</Text></View>
            </View>
            <View style={styles.gridRow}>
                <View style={{ flex: 1 }}><Text style={styles.label}>Pedido Cliente:</Text><Text style={styles.value}>{order.ped_pedcli || ''}</Text></View>
                <View style={{ flex: 1 }}><Text style={styles.label}>Pedido Indústria:</Text><Text style={styles.value}>{order.ped_pedindu || ''}</Text></View>
            </View>
        </View>
    </View>
);

// Billing data section
const BillingSection = ({ order, hideTitle = false, noBorder = false }) => {
    const containerStyle = {
        marginBottom: noBorder ? 0 : 3
    };

    return (
        <View style={containerStyle}>
            {!hideTitle && (
                <View style={{ ...styles.sectionTitle, backgroundColor: '#ffffff', borderBottomWidth: 0, justifyContent: 'center' }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 7, textAlign: 'center' }}>DADOS PARA COBRANÇA</Text>
                </View>
            )}
            <View style={noBorder ? { padding: 0 } : styles.sectionContent}>
                <View style={styles.gridRow}>
                    <View style={{ flex: 1.5 }}><Text style={styles.label}>Endereço:</Text><Text style={styles.value}>O MESMO</Text></View>
                    <View style={{ flex: 1 }}><Text style={styles.label}>Bairro:</Text><Text style={styles.value}></Text></View>
                </View>
                <View style={styles.gridRow}>
                    <View style={{ flex: 1 }}><Text style={styles.label}>Cidade:</Text><Text style={styles.value}></Text></View>
                    <View style={{ flex: 0.5 }}><Text style={styles.label}>Cep:</Text><Text style={styles.value}></Text></View>
                    <View style={{ flex: 0.3 }}><Text style={styles.label}>UF:</Text><Text style={styles.value}></Text></View>
                </View>
                <View style={styles.gridRow}>
                    <Text style={{ ...styles.label, ...styles.redLabel }}>E-Mail financeiro: <Text style={{ textTransform: 'lowercase' }}>{order.cli_emailfinanceiro || ''}</Text></Text>
                </View>
            </View>
        </View>
    );
};

// Carrier/Transporter section
const CarrierSection = ({ order, hideTitle = false, noBorder = false }) => {
    const containerStyle = {
        marginBottom: noBorder ? 0 : 3
    };

    return (
        <View style={containerStyle}>
            {!hideTitle && (
                <View style={{ ...styles.sectionTitle, backgroundColor: '#ffffff', borderBottomWidth: 0, justifyContent: 'center' }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 7, textAlign: 'center' }}>TRANSPORTADORA</Text>
                </View>
            )}
            <View style={noBorder ? { padding: 0 } : styles.sectionContent}>
                <View style={styles.gridRow}>
                    <View style={{ flex: 1.5 }}><Text style={styles.label}>Nome:</Text><Text style={styles.value}>{order.tra_nome || ''}</Text></View>
                </View>
                <View style={styles.gridRow}>
                    <View style={{ flex: 1.5 }}><Text style={styles.label}>Endereço:</Text><Text style={styles.value}>{order.tra_endereco || ''}</Text></View>
                    <View style={{ flex: 1 }}><Text style={styles.label}>Bairro:</Text><Text style={styles.value}>{order.tra_bairro || ''}</Text></View>
                </View>
                <View style={styles.gridRow}>
                    <View style={{ flex: 1 }}><Text style={styles.label}>Cidade:</Text><Text style={styles.value}>{order.tra_cidade || ''}</Text></View>
                    <View style={{ flex: 0.5 }}><Text style={styles.label}>Cep:</Text><Text style={styles.value}>{order.tra_cep || ''}</Text></View>
                    <View style={{ flex: 0.3 }}><Text style={styles.label}>UF:</Text><Text style={styles.value}>{order.tra_uf || ''}</Text></View>
                </View>
                <View style={styles.gridRow}>
                    <View style={{ flex: 1 }}><Text style={styles.label}>CNPJ:</Text><Text style={styles.value}>{formatCpfCnpj(order.tra_cgc)}</Text></View>
                    <View style={{ flex: 1 }}><Text style={styles.label}>I.Est:</Text><Text style={styles.value}>{order.tra_inscricao || ''}</Text></View>
                </View>
                <View style={styles.gridRow}>
                    <View style={{ flex: 1.5 }}><Text style={styles.label}>E-Mail:</Text><Text style={{ ...styles.value, textTransform: 'lowercase' }}>{order.tra_email || ''}</Text></View>
                    <View style={{ flex: 1 }}><Text style={styles.label}>Fone:</Text><Text style={styles.value}>{order.tra_fone || ''}</Text></View>
                </View>
            </View>
        </View>
    );
};      // Observations section
const ObservationsSection = ({ order, highlighted = false }) => (
    <View style={{ marginBottom: 3 }}>
        <Text style={{ ...styles.label, ...styles.redLabel, fontSize: 8 }}>Observações:</Text>
        <View style={{ borderWidth: 0.5, borderColor: '#94a3b8', borderStyle: 'solid', padding: 3, minHeight: 20 }}>
            <Text style={{ fontSize: 7, color: highlighted ? '#dc2626' : '#000000', fontWeight: highlighted ? 'bold' : 'normal' }}>
                {order.ped_obs || ''}
            </Text>
        </View>
    </View>
);

// Order totals section - Matches Delphi layout
const TotalsSection = ({ order, items }) => {
    const totalItems = items?.length || 0;
    const totalQtd = (items || []).reduce((acc, it) => acc + (parseFloat(it.ite_quant) || 0), 0);

    return (
        <View style={{ borderWidth: 0.5, borderColor: '#94a3b8', borderStyle: 'solid', padding: 5, marginTop: 3 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {/* Left column - Totals */}
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                        <Text style={{ ...styles.label, width: 80 }}>Total bruto:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', width: 80 }}>{fv(order.ped_totbruto)}</Text>
                        <Text style={{ ...styles.label, width: 120 }}>Quantidade de itens no pedido:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{totalItems}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                        <Text style={{ ...styles.label, width: 80 }}>Total líquido:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', width: 80 }}>{fv(order.ped_totliq)}</Text>
                        <Text style={{ ...styles.label, width: 120 }}>Qtd total:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{totalQtd}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                        <Text style={{ ...styles.label, width: 80 }}>Total líquido c/IPI:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', width: 80 }}>{fv(order.ped_totalipi || order.ped_totliq)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                        <Text style={{ ...styles.label, width: 80 }}>Valor ST:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', width: 80 }}>{fv(order.ped_vlrist)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={{ ...styles.label, width: 80 }}>Total do pedido:</Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', width: 100, color: '#1e40af' }}>{fv(parseFloat(order.ped_totalipi || order.ped_totliq) + parseFloat(order.ped_vlrist || 0))}</Text>
                    </View>
                </View>
                {/* Right column - Seller */}
                <View style={{ alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                    <Text style={{ ...styles.label }}>Vendedor:</Text>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#dc2626' }}>{order.ven_nome || ''}</Text>
                </View>
            </View>
        </View>
    );
};

// Footer
const ReportFooter = ({ pageNumber, totalPages }) => (
    <View style={styles.footer} fixed>
        <Text>Gerado em: {new Date().toLocaleString('pt-BR')}</Text>
        <Text>Página {pageNumber} de {totalPages}</Text>
    </View>
);

// Model 3 totals - Compact and matching reference
const TotalsSection3 = ({ order, items }) => {
    const totalItems = items?.length || 0;
    const totalQtd = (items || []).reduce((acc, it) => acc + (parseFloat(it.ite_quant) || 0), 0);

    return (
        <View style={{ borderWidth: 0.5, borderColor: '#000000', borderStyle: 'solid', padding: 5, marginTop: 3 }}>
            <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                        <Text style={{ ...styles.label, width: 90 }}>Total líquido:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{fv(order.ped_totliq)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                        <Text style={{ ...styles.label, width: 90 }}>Total líquido c/IPI:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{fv(order.ped_totalipi || order.ped_totliq)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                        <Text style={{ ...styles.label, width: 90 }}>Valor ST:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{fv(order.ped_vlrist)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                        <Text style={{ ...styles.label, width: 90 }}>Total do pedido:</Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e40af' }}>{fv(parseFloat(order.ped_totalipi || order.ped_totliq) + parseFloat(order.ped_vlrist || 0))}</Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={{ ...styles.label, width: 90 }}>Vendedor:</Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#dc2626' }}>{order.ven_nome || ''}</Text>
                    </View>
                </View>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                        <Text style={{ ...styles.label, width: 150 }}>Quantidade de itens no pedido:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', textAlign: 'right', flex: 1 }}>{totalItems}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                        <Text style={{ ...styles.label, width: 150 }}>Qtd total:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', textAlign: 'right', flex: 1 }}>{totalQtd}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 2 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#dc2626' }}>{order.ven_fone || ''}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};


// Model 4: Specialized (Alternative Fields) - Quant, Prod, Embuch (Comp), CodOrig (Conv), Descrição, Un.Liq, Total, IPI
const ItemsModel4 = ({ groupedItems, order }) => {
    const allItems = Object.values(groupedItems).flat();

    // Cálculos precisos de totais
    const subTotalLiq = allItems.reduce((acc, it) => acc + (parseFloat(it.ite_totliquido) || 0), 0);
    const subTotalIpi = allItems.reduce((acc, it) => {
        const liq = parseFloat(it.ite_totliquido) || 0;
        const ipiPerc = parseFloat(it.ite_ipi) || 0;
        return acc + (liq * ipiPerc / 100);
    }, 0);
    const subTotalComIpi = subTotalLiq + subTotalIpi;

    return (
        <View style={{ marginBottom: 3 }}>
            <View style={styles.tableHeader}>
                <Text style={styles.colQuant3}>Quant:</Text>
                <Text style={styles.colProd3}>Produto:</Text>
                <Text style={styles.colComp3}>Complemento:</Text>
                <Text style={styles.colConv3}>Conversão:</Text>
                <Text style={styles.colDesc3}>Descrição do produto:</Text>
                <Text style={styles.colLiq3}>Un.líquido:</Text>
                <Text style={styles.colTotLiq3}>Total liqdo:</Text>
                <Text style={styles.colIpi3}>IPI:</Text>
            </View>

            {allItems.map((item, idx) => {
                const liq = parseFloat(item.ite_totliquido) || 0;
                const ipiPerc = parseFloat(item.ite_ipi) || 0;
                const ipiValor = (liq * ipiPerc / 100);

                return (
                    <View key={idx} style={styles.tableRow} wrap={false}>
                        <Text style={styles.colQuant3}>{item.ite_quant}</Text>
                        <Text style={styles.colProd3}>{item.ite_produto}</Text>
                        <Text style={styles.colComp3}>{item.ite_embuch || ''}</Text>
                        <Text style={styles.colConv3}>{item.pro_codigooriginal || ''}</Text>
                        <Text style={styles.colDesc3}>{item.ite_nomeprod}</Text>
                        <Text style={styles.colLiq3}>{fv(item.ite_puniliq)}</Text>
                        <Text style={{ ...styles.colTotLiq3, fontWeight: 'bold' }}>{fv(item.ite_totliquido)}</Text>
                        <Text style={styles.colIpi3}>{fv(ipiValor)}</Text>
                    </View>
                );
            })}

            <View style={styles.subTotalRow}>
                <Text style={{ ...styles.colQuant3, borderRightWidth: 0, borderLeftWidth: 0 }}>Sub-total:</Text>
                <Text style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' }}></Text>
                <Text style={styles.colLiq3}>{fv(subTotalLiq)}</Text>
                <Text style={styles.colTotLiq3}>{fv(subTotalComIpi)}</Text>
                <Text style={styles.colIpi3}></Text>
            </View>
        </View>
    );
};

// Model 5 totals - Full Horizontal Grid Table (Format 5/6)
const TotalsSection5 = ({ order, items }) => {
    const totalItems = items?.length || 0;
    const totalQtd = (items || []).reduce((acc, it) => acc + (parseFloat(it.ite_quant) || 0), 0);
    const totalPeso = parseFloat(order.ped_pesoliquido) || parseFloat(order.ped_pesobruto) || 0;
    const totalCxs = order.ped_qtdcx || 0;

    return (
        <View style={styles.totalsTable}>
            <View style={styles.totalsTableHeader}>
                <View style={styles.totalsTableCellHeader}><Text>Total líquido</Text></View>
                <View style={styles.totalsTableCellHeader}><Text>Qtd peças</Text></View>
                <View style={styles.totalsTableCellHeader}><Text>Qtd cxs</Text></View>
                <View style={styles.totalsTableCellHeader}><Text>Qtd de itens</Text></View>
                <View style={styles.totalsTableCellHeader}><Text>Peso total</Text></View>
                <View style={{ ...styles.totalsTableCellHeader, borderRightWidth: 0, color: '#1e40af' }}><Text>Total líquido c/IPI:</Text></View>
            </View>
            <View style={styles.totalsTableRow}>
                <View style={styles.totalsTableCellValue}><Text>{fv(order.ped_totliq)}</Text></View>
                <View style={styles.totalsTableCellValue}><Text>{totalQtd}</Text></View>
                <View style={styles.totalsTableCellValue}><Text>{totalCxs}</Text></View>
                <View style={styles.totalsTableCellValue}><Text>{totalItems}</Text></View>
                <View style={styles.totalsTableCellValue}><Text>{totalPeso.toFixed(3)}</Text></View>
                <View style={{ ...styles.totalsTableCellValue, borderRightWidth: 0 }}><Text>{fv(order.ped_totalipi || order.ped_totliq)}</Text></View>
            </View>
        </View>
    );
};

// Model 5: Full Hybrid Table - Sq, Quant, Prod, Conversão, Desc, Un.Liq, Total, IPI
const ItemsModel5 = ({ groupedItems, order }) => {
    let globalSeq = 0;
    const allItems = Object.values(groupedItems).flat();

    // Cálculos precisos de totais
    const subTotalLiq = allItems.reduce((acc, it) => acc + (parseFloat(it.ite_totliquido) || 0), 0);
    const subTotalIpi = allItems.reduce((acc, it) => {
        const liq = parseFloat(it.ite_totliquido) || 0;
        const ipiPerc = parseFloat(it.ite_ipi) || 0;
        return acc + (liq * ipiPerc / 100);
    }, 0);
    const subTotalComIpi = subTotalLiq + subTotalIpi;

    return (
        <View style={{ marginBottom: 3 }}>
            <View style={{ backgroundColor: '#ffffff', padding: 2, borderWidth: 0.5, borderColor: '#94a3b8', borderStyle: 'solid', borderBottomWidth: 0 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 7, ...styles.redLabel }}>
                    Descontos praticados nos itens abaixo: <Text style={{ color: '#000000' }}>{order.ped_desc1 ? `${order.ped_desc1}%` : ''}</Text>
                </Text>
            </View>

            <View style={styles.tableHeader}>
                <Text style={styles.colSq}>Sq:</Text>
                <Text style={styles.colQtd}>Quant:</Text>
                <Text style={styles.colProd}>Produto:</Text>
                <Text style={styles.colConv}>Conversão:</Text>
                <Text style={styles.colDesc}>Descrição do produto:</Text>
                <Text style={styles.colVal}>Un.líquido:</Text>
                <Text style={styles.colTot}>Total liqdo:</Text>
                <Text style={styles.colTax}>IPI:</Text>
            </View>

            {allItems.map((item, idx) => {
                const liq = parseFloat(item.ite_totliquido) || 0;
                const ipiPerc = parseFloat(item.ite_ipi) || 0;
                const ipiValor = (liq * ipiPerc / 100);
                globalSeq++;

                return (
                    <View key={idx} style={styles.tableRow} wrap={false}>
                        <Text style={styles.colSq}>{globalSeq}</Text>
                        <Text style={styles.colQtd}>{item.ite_quant}</Text>
                        <Text style={styles.colProd}>{item.ite_produto}</Text>
                        <Text style={styles.colConv}>{item.pro_codigooriginal || ''}</Text>
                        <Text style={styles.colDesc}>{item.ite_nomeprod}</Text>
                        <Text style={styles.colVal}>{fv(item.ite_puniliq)}</Text>
                        <Text style={{ ...styles.colTot, fontWeight: 'bold' }}>{fv(item.ite_totliquido)}</Text>
                        <Text style={styles.colTax}>{fv(ipiValor)}</Text>
                    </View>
                );
            })}

            <View style={styles.subTotalRow}>
                <Text style={{ width: '65%', paddingLeft: 2 }}>Sub-total:</Text>
                <Text style={{ width: '18%', textAlign: 'right', paddingRight: 2 }}>{fv(subTotalLiq)}</Text>
                <Text style={{ width: '12%', textAlign: 'right', paddingRight: 2 }}>{fv(subTotalComIpi)}</Text>
                <Text style={{ width: '5%' }}></Text>
            </View>
        </View>
    );
};

// Model 7 totals - Horizontal Grid with IPI Value
const TotalsSection7 = ({ order, items }) => {
    const totalItems = items?.length || 0;
    const totalQtd = (items || []).reduce((acc, it) => acc + (parseFloat(it.ite_quant) || 0), 0);
    const totalPeso = parseFloat(order.ped_pesoliquido) || parseFloat(order.ped_pesobruto) || 0;
    const totalIpiVal = (items || []).reduce((acc, it) => {
        const liq = parseFloat(it.ite_totliquido) || 0;
        const ipiPerc = parseFloat(it.ite_ipi) || 0;
        return acc + (liq * ipiPerc / 100);
    }, 0);

    return (
        <View>
            <View style={styles.totalsTable}>
                <View style={styles.totalsTableHeader}>
                    <View style={styles.totalsTableCellHeader}><Text>Total líquido</Text></View>
                    <View style={styles.totalsTableCellHeader}><Text>Qtd peças</Text></View>
                    <View style={styles.totalsTableCellHeader}><Text>Qtd de itens no pedido</Text></View>
                    <View style={styles.totalsTableCellHeader}><Text>Peso total</Text></View>
                    <View style={styles.totalsTableCellHeader}><Text>IPI R$</Text></View>
                    <View style={{ ...styles.totalsTableCellHeader, borderRightWidth: 0 }}><Text>Total líquido c/IPI:</Text></View>
                </View>
                <View style={styles.totalsTableRow}>
                    <View style={styles.totalsTableCellValue}><Text>{fv(order.ped_totliq)}</Text></View>
                    <View style={styles.totalsTableCellValue}><Text>{totalQtd}</Text></View>
                    <View style={styles.totalsTableCellValue}><Text>{totalItems}</Text></View>
                    <View style={styles.totalsTableCellValue}><Text>{totalPeso.toFixed(3)}</Text></View>
                    <View style={styles.totalsTableCellValue}><Text>{fv(totalIpiVal)}</Text></View>
                    <View style={{ ...styles.totalsTableCellValue, borderRightWidth: 0 }}><Text>{fv(order.ped_totalipi || order.ped_totliq)}</Text></View>
                </View>
            </View>
            <View style={{ marginTop: 5 }}>
                <Text style={{ ...styles.label, color: '#dc2626' }}>Vendedor: <Text style={{ color: '#000000', fontWeight: 'bold' }}>{order.ven_nome || ''}</Text> <Text style={{ color: '#dc2626', marginLeft: 20 }}>{order.ven_fone || ''}</Text></Text>
                <Text style={{ ...styles.label, marginTop: 2 }}>Observações complementares:</Text>
                <View style={{ borderWidth: 0.5, borderColor: '#94a3b8', borderStyle: 'solid', padding: 3, minHeight: 40, marginTop: 2 }}>
                    <Text style={{ fontSize: 7 }}>{order.ped_obscomplementar || ''}</Text>
                </View>
            </View>
        </View>
    );
};

// Model 7: Similar to 1 but with IPI Value - Sq, Quant, Prod, Desc, Un.Bruto, Un.Liq, Total, IPI
const ItemsModel7 = ({ groupedItems }) => {
    let globalSeq = 0;
    const allItems = Object.values(groupedItems).flat();
    const subTotalLiq = allItems.reduce((acc, it) => acc + (parseFloat(it.ite_totliquido) || 0), 0);

    return (
        <View style={{ marginBottom: 3 }}>
            <View style={styles.tableHeader}>
                <Text style={styles.colSq}>Sq:</Text>
                <Text style={styles.colQtd}>Quant:</Text>
                <Text style={styles.colProd}>Produto:</Text>
                <Text style={styles.colDesc}>Descrição do produto:</Text>
                <Text style={styles.colVal}>Un.Bruto:</Text>
                <Text style={styles.colVal}>Un.líquido:</Text>
                <Text style={styles.colTot}>Total liqdo:</Text>
                <Text style={styles.colTax}>IPI:</Text>
            </View>

            {allItems.map((item, idx) => {
                const liq = parseFloat(item.ite_totliquido) || 0;
                const ipiPerc = parseFloat(item.ite_ipi) || 0;
                const ipiValor = (liq * ipiPerc / 100);
                globalSeq++;

                return (
                    <View key={idx} style={{ ...styles.tableRow, flexDirection: 'column' }} wrap={false}>
                        <View style={{ flexDirection: 'row' }}>
                            <Text style={styles.colSq}>{globalSeq}</Text>
                            <Text style={styles.colQtd}>{item.ite_quant}</Text>
                            <Text style={styles.colProd}>{item.ite_produto}</Text>
                            <Text style={styles.colDesc}>{item.ite_nomeprod}</Text>
                            <Text style={styles.colVal}>{fv(item.ite_puni)}</Text>
                            <Text style={styles.colVal}>{fv(item.ite_puniliq)}</Text>
                            <Text style={{ ...styles.colTot, fontWeight: 'bold' }}>{fv(item.ite_totliquido)}</Text>
                            <Text style={styles.colTax}>{fv(ipiValor)}</Text>
                        </View>
                        {item.pro_aplicacao && (
                            <View style={{ paddingLeft: '18.5%', paddingBottom: 2 }}>
                                <Text style={{ fontSize: 7, color: '#4b5563' }}>{item.pro_aplicacao}</Text>
                            </View>
                        )}
                    </View>
                );
            })}

            <View style={styles.subTotalRow}>
                <Text style={{ width: '82%', paddingLeft: 2 }}>Sub-total:</Text>
                <Text style={{ width: '13%', textAlign: 'right', paddingRight: 2 }}>{fv(subTotalLiq)}</Text>
                <Text style={{ width: '5%' }}></Text>
            </View>
        </View>
    );
};

// Model 8: High Precision (3 decimals) - Quant, Prod, Desc, Un.Liq (3), Un.c/IPI (3), Tot.Liq (2), Tot.c/IPI (2), IPI%
const ItemsModel8 = ({ groupedItems, order }) => {
    const allItems = Object.values(groupedItems).flat();

    // Cálculos precisos de totais
    const subTotalBruto = allItems.reduce((acc, it) => acc + (parseFloat(it.ite_totbruto) || 0), 0);
    const subTotalLiq = allItems.reduce((acc, it) => acc + (parseFloat(it.ite_totliquido) || 0), 0);
    const subTotalComIpi = allItems.reduce((acc, it) => {
        const liq = parseFloat(it.ite_totliquido) || 0;
        const ipiPerc = parseFloat(it.ite_ipi) || 0;
        return acc + (liq * (1 + ipiPerc / 100));
    }, 0);

    return (
        <View style={{ marginBottom: 3 }}>
            <View style={styles.tableHeader}>
                <Text style={{ width: '5%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' }}>Quant:</Text>
                <Text style={{ width: '8%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' }}>Produto:</Text>
                <Text style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingLeft: 2 }}>Descrição do produto:</Text>
                <Text style={{ width: '9%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>Unitário:</Text>
                <Text style={{ width: '9%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>Un.c/IPI:</Text>
                <Text style={{ width: '10%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>Total:</Text>
                <Text style={{ width: '10%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>Total c/IPI:</Text>
                <Text style={{ width: '5%', textAlign: 'right', paddingRight: 2 }}>IPI:</Text>
            </View>

            {allItems.map((item, idx) => {
                const liq = parseFloat(item.ite_totliquido) || 0;
                const ipiPerc = parseFloat(item.ite_ipi) || 0;
                const pLiq = parseFloat(item.ite_puniliq) || 0;
                const pComIpi = pLiq * (1 + ipiPerc / 100);
                const tComIpi = liq * (1 + ipiPerc / 100);

                return (
                    <View key={idx} style={{ ...styles.tableRow, flexDirection: 'column' }} wrap={false}>
                        <View style={{ flexDirection: 'row' }}>
                            <Text style={{ width: '5%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' }}>{item.ite_quant}</Text>
                            <Text style={{ width: '8%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' }}>{item.ite_produto}</Text>
                            <Text style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingLeft: 2 }}>{item.ite_nomeprod}</Text>
                            <Text style={{ width: '9%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>{fv3(pLiq)}</Text>
                            <Text style={{ width: '9%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>{fv3(pComIpi)}</Text>
                            <Text style={{ width: '10%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>{fv(liq)}</Text>
                            <Text style={{ width: '10%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2, fontWeight: 'bold' }}>{fv(tComIpi)}</Text>
                            <Text style={{ width: '5%', textAlign: 'right', paddingRight: 2 }}>{fv(ipiPerc)}</Text>
                        </View>
                        {item.pro_aplicacao && (
                            <View style={{ paddingLeft: '13%', paddingBottom: 2 }}>
                                <Text style={{ fontSize: 7, color: '#4b5563' }}>{item.pro_aplicacao}</Text>
                            </View>
                        )}
                    </View>
                );
            })}

            <View style={styles.subTotalRow}>
                <Text style={{ width: '5%', borderRightWidth: 0 }}>Sub-total:</Text>
                <Text style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' }}></Text>
                <Text style={{ width: '9%', textAlign: 'right', paddingRight: 2 }}>{fv(subTotalBruto)}</Text>
                <Text style={{ width: '9%', textAlign: 'right', paddingRight: 2 }}>{fv(subTotalComIpi)}</Text>
                <Text style={{ width: '10%', textAlign: 'right', paddingRight: 2 }}>{fv(subTotalLiq)}</Text>
                <Text style={{ width: '10%', textAlign: 'right', paddingRight: 2 }}>{fv(subTotalComIpi)}</Text>
                <Text style={{ width: '5%' }}></Text>
            </View>
        </View>
    );
};

// Model 9 totals - Detailed Taxes Summary
const TotalsSection9 = ({ order, items }) => {
    const totalItems = items?.length || 0;
    const totalQtd = (items || []).reduce((acc, it) => acc + (parseFloat(it.ite_quant) || 0), 0);
    const totalImp = parseFloat(order.ped_totalipi || 0) + parseFloat(order.ped_vlrist || 0);

    return (
        <View style={{ borderWidth: 0.5, borderColor: '#000000', borderStyle: 'solid', padding: 5, marginTop: 3 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                        <Text style={{ ...styles.label, width: 120 }}>Total líquido:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', width: 80 }}>{fv(order.ped_totliq)}</Text>
                        <Text style={{ ...styles.label, width: 150 }}>Quantidade de itens no pedido:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{totalItems}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                        <Text style={{ ...styles.label, width: 120 }}>Total líquido c/ impostos:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', width: 80 }}>{fv(parseFloat(order.ped_totliq) + totalImp)}</Text>
                        <Text style={{ ...styles.label, width: 150 }}>Qtd total:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{totalQtd}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

// Model 9: Taxes Column - Quant, Prod, Desc, Unit, Total, Impostos(R$), Total c/Imp, IPI%, ST%
const ItemsModel9 = ({ groupedItems, order }) => {
    let globalSeq = 0;
    const allItems = Object.values(groupedItems).flat();

    // Cálculos precisos de totais
    const subTotalLiq = allItems.reduce((acc, it) => acc + (parseFloat(it.ite_totliquido) || 0), 0);
    const subTotalImp = allItems.reduce((acc, it) => {
        const liq = parseFloat(it.ite_totliquido) || 0;
        const ipiPerc = parseFloat(it.ite_ipi) || 0;
        const stVal = parseFloat(it.ite_valcomst || 0) - parseFloat(it.ite_valcomipi || liq);
        return acc + (liq * ipiPerc / 100) + stVal;
    }, 0);
    const subTotalGeral = subTotalLiq + subTotalImp;

    return (
        <View style={{ marginBottom: 3 }}>
            <View style={styles.tableHeader}>
                <Text style={{ width: '4%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' }}>Sq:</Text>
                <Text style={{ width: '4%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' }}>Quant:</Text>
                <Text style={{ width: '8%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' }}>Produto:</Text>
                <Text style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingLeft: 2 }}>Descrição do produto:</Text>
                <Text style={{ width: '9%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>Unitário:</Text>
                <Text style={{ width: '9%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>Total:</Text>
                <Text style={{ width: '9%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>Impostos (R$):</Text>
                <Text style={{ width: '9%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>Total c/Imp:</Text>
                <Text style={{ width: '4%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>IPI:</Text>
                <Text style={{ width: '4%', textAlign: 'right', paddingRight: 2 }}>ST:</Text>
            </View>

            {allItems.map((item, idx) => {
                const liq = parseFloat(item.ite_totliquido) || 0;
                const ipiPerc = parseFloat(item.ite_ipi) || 0;
                const ipiVal = (liq * ipiPerc / 100);
                const stVal = parseFloat(item.ite_valcomst || 0) - parseFloat(item.ite_valcomipi || liq);
                const totalImp = ipiVal + stVal;
                const totalComImp = liq + totalImp;
                globalSeq++;

                return (
                    <View key={idx} style={{ ...styles.tableRow, flexDirection: 'column' }} wrap={false}>
                        <View style={{ flexDirection: 'row' }}>
                            <Text style={{ width: '4%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' }}>{globalSeq}</Text>
                            <Text style={{ width: '4%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' }}>{item.ite_quant}</Text>
                            <Text style={{ width: '8%', textAlign: 'center', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' }}>{item.ite_produto}</Text>
                            <Text style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingLeft: 2 }}>{item.ite_nomeprod}</Text>
                            <Text style={{ width: '9%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>{fv(item.ite_puniliq)}</Text>
                            <Text style={{ width: '9%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>{fv(liq)}</Text>
                            <Text style={{ width: '9%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>{fv(totalImp)}</Text>
                            <Text style={{ width: '9%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>{fv(totalComImp)}</Text>
                            <Text style={{ width: '4%', textAlign: 'right', borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid', paddingRight: 2 }}>{fv(ipiPerc)}</Text>
                            <Text style={{ width: '4%', textAlign: 'right', paddingRight: 2 }}>{fv(item.ite_st)}</Text>
                        </View>
                        {item.pro_aplicacao && (
                            <View style={{ paddingLeft: '16%', paddingBottom: 2 }}>
                                <Text style={{ fontSize: 7, color: '#4b5563' }}>{item.pro_aplicacao}</Text>
                            </View>
                        )}
                    </View>
                );
            })}

            <View style={styles.subTotalRow}>
                <Text style={{ width: '40%', paddingLeft: 2 }}>Sub-total:</Text>
                <Text style={{ width: '9%', textAlign: 'right', marginLeft: 'auto', paddingRight: 2 }}>{fv(subTotalLiq)}</Text>
                <Text style={{ width: '9%', textAlign: 'right', paddingRight: 2 }}>{fv(subTotalImp)}</Text>
                <Text style={{ width: '9%', textAlign: 'right', paddingRight: 2 }}>{fv(subTotalGeral)}</Text>
                <Text style={{ width: '8%' }}></Text>
            </View>
        </View>
    );
};

// Model 3: Specialized - Quant, Prod, Complemento, Conversão, Descrição, Un.Liq, Total, IPI
const ItemsModel3 = ({ groupedItems, order }) => {
    let globalSeq = 0;
    const allItems = Object.values(groupedItems).flat();

    // Cálculos precisos de totais
    const subTotalLiq = allItems.reduce((acc, it) => acc + (parseFloat(it.ite_totliquido) || 0), 0);
    const subTotalIpi = allItems.reduce((acc, it) => {
        const liq = parseFloat(it.ite_totliquido) || 0;
        const ipiPerc = parseFloat(it.ite_ipi) || 0;
        return acc + (liq * ipiPerc / 100);
    }, 0);
    const subTotalComIpi = subTotalLiq + subTotalIpi;





    return (
        <View style={{ marginBottom: 3 }}>
            {/* Discount Header - Fixed format for Model 3 */}
            <View style={{ backgroundColor: '#ffffff', padding: 2, borderWidth: 0.5, borderColor: '#94a3b8', borderStyle: 'solid', borderBottomWidth: 0 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 7, ...styles.redLabel }}>
                    Descontos: <Text style={{ color: '#000000' }}>{getDiscountString(order)}</Text>
                </Text>
            </View>

            {/* Table Header - Model 3 */}
            <View style={styles.tableHeader}>
                <Text style={styles.colQuant3}>Quant:</Text>
                <Text style={styles.colProd3}>Produto:</Text>
                <Text style={styles.colComp3}>Complemento:</Text>
                <Text style={styles.colConv3}>Conversão:</Text>
                <Text style={styles.colDesc3}>Descrição do produto:</Text>
                <Text style={styles.colLiq3}>Un.líquido:</Text>
                <Text style={styles.colTotLiq3}>Total liqdo:</Text>
                <Text style={styles.colIpi3}>IPI:</Text>
            </View>

            {/* Items */}
            {allItems.map((item, idx) => {
                const liq = parseFloat(item.ite_totliquido) || 0;
                const ipiPerc = parseFloat(item.ite_ipi) || 0;
                const ipiValor = (liq * ipiPerc / 100);

                return (
                    <View key={idx} style={styles.tableRow} wrap={false}>
                        <Text style={styles.colQuant3}>{item.ite_quant}</Text>
                        <Text style={styles.colProd3}>{item.ite_produto}</Text>
                        <Text style={styles.colComp3}>{item.ite_complemento || ''}</Text>
                        <Text style={styles.colConv3}>{item.ite_conversao || ''}</Text>
                        <Text style={styles.colDesc3}>{item.ite_nomeprod}</Text>
                        <Text style={styles.colLiq3}>{fv(item.ite_puniliq)}</Text>
                        <Text style={{ ...styles.colTotLiq3, fontWeight: 'bold' }}>{fv(item.ite_totliquido)}</Text>
                        <Text style={styles.colIpi3}>{fv(ipiValor)}</Text>
                    </View>
                );
            })}

            {/* Sub-total Row */}
            <View style={styles.subTotalRow}>
                <Text style={{ ...styles.colQuant3, borderRightWidth: 0, borderLeftWidth: 0 }}>Sub-total:</Text>
                <Text style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: '#94a3b8', borderRightStyle: 'solid' }}></Text>
                <Text style={styles.colLiq3}>{fv(subTotalLiq)}</Text>
                <Text style={styles.colTotLiq3}>{fv(subTotalComIpi)}</Text>
                <Text style={styles.colIpi3}></Text>
            </View>
        </View>
    );
};

// Model 1: Standard - Sq, Qtd, Prod, Desc, Un.Bruto, Un.Liq, Total
const ItemsModel1 = ({ groupedItems }) => {
    let globalSeq = 0;

    return Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => {
        const groupTotalLiquido = groupItems.reduce((acc, it) => acc + (parseFloat(it.ite_totliquido) || 0), 0);

        return (
            <View key={groupIndex} style={{ marginBottom: 3 }}>
                {/* Discount Header */}
                <View style={{ backgroundColor: '#ffffff', padding: 2, borderWidth: 0.5, borderColor: '#94a3b8', borderStyle: 'solid' }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 7, ...styles.redLabel }}>
                        Descontos: <Text style={{ color: '#000000' }}>{discountKey}</Text>
                    </Text>
                </View>

                {/* Table Header - Model 1 */}
                <View style={styles.tableHeader}>
                    <Text style={styles.colSq}>Sq:</Text>
                    <Text style={styles.colQtd}>Quant:</Text>
                    <Text style={styles.colProd}>Produto:</Text>
                    <Text style={styles.colDesc}>Descrição do produto:</Text>
                    <Text style={styles.colVal}>Un.Bruto:</Text>
                    <Text style={styles.colVal}>Un.líquido:</Text>
                    <Text style={styles.colTot}>Total lqdo:</Text>
                    <Text style={styles.colTax}>IPI:</Text>
                </View>

                {/* Items */}
                {groupItems.map((item, idx) => {
                    globalSeq++;
                    return (
                        <View key={idx} style={styles.tableRow} wrap={false}>
                            <Text style={styles.colSq}>{globalSeq}</Text>
                            <Text style={styles.colQtd}>{item.ite_quant}</Text>
                            <Text style={styles.colProd}>{item.ite_produto}</Text>
                            <Text style={styles.colDesc}>{item.ite_nomeprod}</Text>
                            <Text style={styles.colVal}>{fv(item.ite_puni)}</Text>
                            <Text style={styles.colVal}>{fv(item.ite_puniliq)}</Text>
                            <Text style={{ ...styles.colTot, fontWeight: 'bold' }}>{fv(item.ite_totliquido)}</Text>
                            <Text style={styles.colTax}>{fv(item.ite_ipi || 0)}</Text>
                        </View>
                    );
                })}

                {/* Subtotal */}
                <View style={styles.subTotalRow}>
                    <Text style={{ width: '65%', paddingLeft: 2 }}>Sub-total:</Text>
                    <Text style={{ width: '18%', textAlign: 'right', paddingRight: 2 }}>{fv(groupTotalLiquido)}</Text>
                    <Text style={{ width: '12%', textAlign: 'right', paddingRight: 2 }}>{fv(groupTotalLiquido)}</Text>
                    <Text style={{ width: '5%' }}></Text>
                </View>
            </View>
        );
    });
};

// Model 2: Cotação - Sq, Quant, Prod, Desc, Unit c/IPI, Total c/IPI, %IPI
const ItemsModel2 = ({ groupedItems }) => {
    let globalSeq = 0;

    return Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => {
        const groupTotalIPI = groupItems.reduce((acc, it) => acc + (parseFloat(it.ite_totalipi) || parseFloat(it.ite_totliquido) || 0), 0);

        return (
            <View key={groupIndex} style={{ marginBottom: 3 }}>
                {/* Discount Header */}
                <View style={{ backgroundColor: '#ffffff', padding: 2, borderWidth: 0.5, borderColor: '#94a3b8', borderStyle: 'solid' }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 7, ...styles.redLabel }}>
                        Descontos praticados nos itens abaixo: <Text style={{ color: '#000000' }}>{discountKey}</Text>
                    </Text>
                </View>

                {/* Table Header - Model 2 */}
                <View style={styles.tableHeader}>
                    <Text style={styles.colSq}>Sq:</Text>
                    <Text style={styles.colQtd}>Quant:</Text>
                    <Text style={styles.colProd}>Produto:</Text>
                    <Text style={styles.colDesc}>Descrição do produto:</Text>
                    <Text style={styles.colVal}>Unit c/IPI:</Text>
                    <Text style={styles.colTot}>Total c/IPI:</Text>
                    <Text style={styles.colTax}>%IPI:</Text>
                </View>

                {/* Items */}
                {groupItems.map((item, idx) => {
                    globalSeq++;
                    const unitIPI = parseFloat(item.ite_puniipi) || parseFloat(item.ite_puniliq) || 0;
                    const totalIPI = parseFloat(item.ite_totalipi) || parseFloat(item.ite_totliquido) || 0;
                    const percIPI = parseFloat(item.ite_ipi) || 0;
                    return (
                        <View key={idx} style={styles.tableRow} wrap={false}>
                            <Text style={styles.colSq}>{globalSeq}</Text>
                            <Text style={styles.colQtd}>{item.ite_quant}</Text>
                            <Text style={styles.colProd}>{item.ite_produto}</Text>
                            <Text style={styles.colDesc}>{item.ite_nomeprod}</Text>
                            <Text style={styles.colVal}>{fv(unitIPI)}</Text>
                            <Text style={{ ...styles.colTot, fontWeight: 'bold' }}>{fv(totalIPI)}</Text>
                            <Text style={styles.colTax}>{fv(percIPI)}</Text>
                        </View>
                    );
                })}

                {/* Subtotal */}
                <View style={styles.subTotalRow}>
                    <Text style={{ width: '70%', paddingLeft: 2 }}>Sub-total:</Text>
                    <Text style={{ width: '20%', textAlign: 'right', paddingRight: 2 }}>{fv(groupTotalIPI)}</Text>
                    <Text style={{ width: '10%' }}></Text>
                </View>
            </View>
        );
    });
};

// Model 14 totals - Executive Grid for Quotes
const TotalsSection14 = ({ order, items }) => {
    const totalItems = items?.length || 0;
    const totalQtd = (items || []).reduce((acc, it) => acc + (parseFloat(it.ite_quant) || 0), 0);
    const totalComImpostos = parseFloat(order.ped_totliq) + parseFloat(order.ped_totalipi || 0) + parseFloat(order.ped_vlrist || 0);

    const BoxHeader = ({ title }) => (
        <View style={{ backgroundColor: '#64748b', padding: 2, borderBottomWidth: 0.5, borderBottomColor: '#000', borderBottomStyle: 'solid' }}>
            <Text style={{ color: '#ffffff', fontSize: 8, fontWeight: 'bold', textAlign: 'center' }}>{title}</Text>
        </View>
    );

    return (
        <View>
            <View style={{ flexDirection: 'row', borderWidth: 0.5, borderColor: '#000', borderStyle: 'solid', marginTop: 3 }}>
                <View style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: '#000', borderRightStyle: 'solid' }}>
                    <BoxHeader title="Total bruto" />
                    <Text style={{ textAlign: 'center', padding: 3, fontSize: 9 }}>{fv(order.ped_totbruto)}</Text>
                </View>
                <View style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: '#000', borderRightStyle: 'solid' }}>
                    <BoxHeader title="Total" />
                    <Text style={{ textAlign: 'center', padding: 3, fontSize: 9, fontWeight: 'bold' }}>{fv(order.ped_totliq)}</Text>
                </View>
                <View style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: '#000', borderRightStyle: 'solid' }}>
                    <BoxHeader title="Com Impostos" />
                    <Text style={{ textAlign: 'center', padding: 3, fontSize: 9, fontWeight: 'bold' }}>{fv(totalComImpostos)}</Text>
                </View>
                <View style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: '#000', borderRightStyle: 'solid' }}>
                    <BoxHeader title="Nº Ítens" />
                    <Text style={{ textAlign: 'center', padding: 3, fontSize: 9 }}>{totalItems}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <BoxHeader title="Qtd total" />
                    <Text style={{ textAlign: 'center', padding: 3, fontSize: 9 }}>{totalQtd}</Text>
                </View>
            </View>
            <View style={{ backgroundColor: '#64748b', padding: 2, marginTop: 2, borderWidth: 0.5, borderColor: '#000', borderStyle: 'solid' }}>
                <Text style={{ color: '#ffffff', fontSize: 8, fontWeight: 'bold', textAlign: 'center' }}>OBSERVAÇÕES GERAIS</Text>
            </View>
            <View style={{ borderWidth: 0.5, borderColor: '#000', borderStyle: 'solid', borderTopWidth: 0, padding: 4, minHeight: 40 }}>
                <Text style={{ fontSize: 7 }}>{order.ped_obs || ''}</Text>
            </View>
        </View>
    );
};

// Model 13 totals - Landscape composite footer
const TotalsSection13 = ({ order, items }) => {
    const totalItems = items?.length || 0;
    const totalQtd = (items || []).reduce((acc, it) => acc + (parseFloat(it.ite_quant) || 0), 0);
    const totalComImpostos = parseFloat(order.ped_totliq) + parseFloat(order.ped_totalipi || 0) + parseFloat(order.ped_vlrist || 0);

    const BoxHeader = ({ title }) => (
        <View style={{ backgroundColor: '#94a3b8', padding: 2, borderBottomWidth: 0.5, borderBottomColor: '#000', borderBottomStyle: 'solid' }}>
            <Text style={{ color: '#ffffff', fontSize: 7, fontWeight: 'bold', textAlign: 'center', textTransform: 'uppercase' }}>{title}</Text>
        </View>
    );

    return (
        <View style={{ flexDirection: 'row', gap: 5 }}>
            {/* Left side: Totals Grid + Obs */}
            <View style={{ flex: 1.5 }}>
                <View style={{ flexDirection: 'row', borderWidth: 0.5, borderColor: '#000', borderStyle: 'solid' }}>
                    <View style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: '#000', borderRightStyle: 'solid' }}>
                        <BoxHeader title="Total bruto" />
                        <Text style={{ textAlign: 'center', padding: 2, fontSize: 8, fontWeight: 'bold' }}>{fv(order.ped_totbruto)}</Text>
                    </View>
                    <View style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: '#000', borderRightStyle: 'solid' }}>
                        <BoxHeader title="Total" />
                        <Text style={{ textAlign: 'center', padding: 2, fontSize: 8, fontWeight: 'bold' }}>{fv(order.ped_totliq)}</Text>
                    </View>
                    <View style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: '#000', borderRightStyle: 'solid' }}>
                        <BoxHeader title="Com Impostos" />
                        <Text style={{ textAlign: 'center', padding: 2, fontSize: 8, fontWeight: 'bold' }}>{fv(totalComImpostos)}</Text>
                    </View>
                    <View style={{ flex: 1, borderRightWidth: 0.5, borderRightColor: '#000', borderRightStyle: 'solid' }}>
                        <BoxHeader title="Nº ítens" />
                        <Text style={{ textAlign: 'center', padding: 2, fontSize: 8, fontWeight: 'bold' }}>{totalItems}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <BoxHeader title="Qtd total" />
                        <Text style={{ textAlign: 'center', padding: 2, fontSize: 8, fontWeight: 'bold' }}>{totalQtd}</Text>
                    </View>
                </View>
                <View style={{ borderWidth: 0.5, borderColor: '#000', borderStyle: 'solid', marginTop: 2 }}>
                    <BoxHeader title="OBSERVAÇÕES GERAIS" />
                    <View style={{ minHeight: 40, padding: 3 }}>
                        <Text style={{ fontSize: 7 }}>{order.ped_obs || order.ped_obscomplementar || ''}</Text>
                    </View>
                </View>
            </View>

            {/* Right side: Carrier */}
            <View style={{ flex: 1, borderWidth: 0.5, borderColor: '#000', borderStyle: 'solid' }}>
                <BoxHeader title="TRANSPORTADORA" />
                <View style={{ padding: 3, gap: 1 }}>
                    <View style={{ flexDirection: 'row' }}><Text style={styles.label}>CNPJ: </Text><Text style={styles.value}>{formatCpfCnpj(order.tra_cgc)}</Text><Text style={styles.label}> - Inscrição</Text></View>
                    <View style={{ flexDirection: 'row' }}><Text style={styles.label}>Nome: </Text><Text style={styles.value}>{order.tra_nome || ''}</Text></View>
                    <View style={{ flexDirection: 'row' }}><Text style={styles.label}>Fone: </Text><Text style={styles.value}>{order.tra_fone || ''}</Text></View>
                    <View style={{ flexDirection: 'row' }}><Text style={styles.label}>E-Mail: </Text><Text style={{ ...styles.value, textTransform: 'lowercase' }}>{order.tra_email || ''}</Text></View>
                </View>
            </View>
        </View>
    );
};

// Model 12 totals - Grid with IPI and ST in Footer
const TotalsSection12 = ({ order, items }) => {
    const totalItems = items?.length || 0;
    const totalQtd = (items || []).reduce((acc, it) => acc + (parseFloat(it.ite_quant) || 0), 0);
    const totalComImpostos = parseFloat(order.ped_totliq) + parseFloat(order.ped_totalipi || 0) + parseFloat(order.ped_vlrist || 0);

    return (
        <View>
            <View style={{ borderWidth: 0.5, borderColor: '#000000', borderStyle: 'solid', padding: 5, marginTop: 3 }}>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                            <Text style={{ ...styles.label, width: 100 }}>Total bruto:</Text>
                            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{fv(order.ped_totbruto)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                            <Text style={{ ...styles.label, width: 100 }}>Total líquido:</Text>
                            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{fv(order.ped_totliq)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                            <Text style={{ ...styles.label, width: 140 }}>Total líquido c/IPI e ST:</Text>
                            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{fv(totalComImpostos)}</Text>
                        </View>
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                            <Text style={{ ...styles.label, width: 150 }}>Quantidade de itens no pedido:</Text>
                            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{totalItems}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                            <Text style={{ ...styles.label, width: 150 }}>Qtd total:</Text>
                            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{totalQtd}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                            <Text style={{ ...styles.label, width: 150 }}>Vendedor: <Text style={{ color: '#dc2626', fontWeight: 'bold' }}>{order.ven_nome || ''}</Text></Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={{ marginTop: 5 }}>
                <Text style={{ fontSize: 8, fontWeight: 'bold', textAlign: 'center', textDecoration: 'underline' }}>OBSERVAÇÕES GERAIS</Text>
                <View style={{ borderWidth: 0.5, borderColor: '#000000', borderStyle: 'solid', padding: 5, marginTop: 2, minHeight: 60 }}>
                    <Text style={{ fontSize: 7 }}>{order.ped_obs || order.ped_obscomplementar || ''}</Text>
                </View>
            </View>
        </View>
    );
};

// Model 11 totals - Clean Grid with Observações Gerais
const TotalsSection11 = ({ order, items }) => {
    const totalItems = items?.length || 0;
    const totalQtd = (items || []).reduce((acc, it) => acc + (parseFloat(it.ite_quant) || 0), 0);

    return (
        <View>
            <View style={{ borderWidth: 0.5, borderColor: '#000000', borderStyle: 'solid', padding: 5, marginTop: 3 }}>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                            <Text style={{ ...styles.label, width: 100 }}>Total bruto:</Text>
                            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{fv(order.ped_totbruto)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                            <Text style={{ ...styles.label, width: 100 }}>Total líquido:</Text>
                            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{fv(order.ped_totliq)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                            <Text style={{ ...styles.label, width: 100 }}>Total líquido c/IPI:</Text>
                            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{fv(order.ped_totalipi || order.ped_totliq)}</Text>
                        </View>
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                            <Text style={{ ...styles.label, width: 150 }}>Quantidade de itens no pedido:</Text>
                            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{totalItems}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                            <Text style={{ ...styles.label, width: 150 }}>Qtd total:</Text>
                            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{totalQtd}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                            <Text style={{ ...styles.label, width: 150 }}>Vendedor: <Text style={{ color: '#dc2626', fontWeight: 'bold' }}>{order.ven_nome || ''}</Text></Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={{ marginTop: 5 }}>
                <Text style={{ fontSize: 8, fontWeight: 'bold', textAlign: 'center', textDecoration: 'underline' }}>OBSERVAÇÕES GERAIS</Text>
                <View style={{ borderWidth: 0.5, borderColor: '#000000', borderStyle: 'solid', padding: 5, marginTop: 2, minHeight: 60 }}>
                    <Text style={{ fontSize: 7 }}>{order.ped_obs || order.ped_obscomplementar || ''}</Text>
                </View>
            </View>
        </View>
    );
};

// Model 10 totals - Grid Style with Seller Info
const TotalsSection10 = ({ order, items }) => {
    const totalItems = items?.length || 0;
    const totalQtd = (items || []).reduce((acc, it) => acc + (parseFloat(it.ite_quant) || 0), 0);

    return (
        <View style={{ borderWidth: 0.5, borderColor: '#000000', borderStyle: 'solid', padding: 5, marginTop: 3 }}>
            <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                        <Text style={{ ...styles.label, width: 90 }}>Total líquido:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', width: 80 }}>{fv(order.ped_totliq)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                        <Text style={{ ...styles.label, width: 90 }}>Total líquido c/IPI:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', width: 80 }}>{fv(order.ped_totalipi || order.ped_totliq)}</Text>
                    </View>
                </View>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                        <Text style={{ ...styles.label, width: 150 }}>Quantidade de itens no pedido:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{totalItems}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                        <Text style={{ ...styles.label, width: 150 }}>Qtd total:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{totalQtd}</Text>
                    </View>
                </View>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 2 }}>
                <Text style={{ ...styles.label, ...styles.redLabel }}>Vendedor: <Text style={{ color: '#000000', fontWeight: 'bold' }}>{order.ven_nome || ''}</Text></Text>
                <Text style={{ ...styles.label, ...styles.redLabel, marginLeft: 150 }}>{order.ven_fone || ''}</Text>
            </View>
            <View style={{ marginTop: 4 }}>
                <Text style={styles.label}>Observações complementares:</Text>
                <View style={{ borderWidth: 0.5, borderColor: '#cbd5e1', borderStyle: 'solid', padding: 3, marginTop: 2, minHeight: 40 }}>
                    <Text style={{ fontSize: 7 }}>{order.ped_obscomplementar || ''}</Text>
                </View>
            </View>
        </View>
    );
};

// Order totals section for Model 2 - Cotação
const TotalsSection2 = ({ order, items }) => {
    const totalItems = items?.length || 0;
    const totalQtd = (items || []).reduce((acc, it) => acc + (parseFloat(it.ite_quant) || 0), 0);

    return (
        <View style={{ borderWidth: 0.5, borderColor: '#94a3b8', borderStyle: 'solid', padding: 5, marginTop: 3 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {/* Left column - Totals */}
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                        <Text style={{ ...styles.label, width: 80 }}>Total líquido:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', width: 80 }}>{fv(order.ped_totliq)}</Text>
                        <Text style={{ ...styles.label, width: 120 }}>Quantidade de itens no pedido:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{totalItems}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                        <Text style={{ ...styles.label, width: 80 }}>Total líquido c/IPI:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', width: 80 }}>{fv(order.ped_totalipi || order.ped_totliq)}</Text>
                        <Text style={{ ...styles.label, width: 120 }}>Qtd total:</Text>
                        <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{totalQtd}</Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={{ ...styles.label }}>Observações complementares:</Text>
                    </View>
                    <View style={{ borderWidth: 0.5, borderColor: '#cbd5e1', borderStyle: 'solid', padding: 3, marginTop: 2, minHeight: 30 }}>
                        <Text style={{ fontSize: 7 }}>{order.ped_obscomplementar || ''}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

// Helper to ensure Base64 has correct prefix and is clean
const formatBase64 = (data) => {
    if (!data) return '';

    // Convert to string if it's a Buffer/binary
    let base64String = typeof data === 'string' ? data : String(data);

    // Clean string: remove any existing data:image prefix to avoid double-prefixing
    // and remove all whitespace/newlines
    let cleanString = base64String.replace(/^data:image\/[a-z]+;base64,/, '').replace(/[\n\r\s]/g, '');

    if (cleanString.length < 20) return ''; // Too short

    // Detect MIME type via standard base64 markers
    let mime = 'image/png'; // Default
    if (cleanString.startsWith('/9j/')) mime = 'image/jpeg';
    else if (cleanString.startsWith('R0lGOD')) mime = 'image/gif';
    else if (cleanString.startsWith('PHN2Zy')) mime = 'image/svg+xml';

    return `data:${mime};base64,${cleanString}`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const OrderPdfReport = ({ order, items, companyData, model = '1' }) => {
    // Extract data from companyData and order
    // Ensure model is treated as integer safely
    const modelInt = parseInt(model, 10);
    const modelNum = isNaN(modelInt) ? 1 : modelInt;

    const repInfo = {
        rep_nome: companyData?.nome || '',
        rep_cnpj: companyData?.cnpj || '',
        rep_fone: companyData?.fones || '',
        rep_endereco: companyData?.endereco || '',
        rep_bairro: companyData?.bairro || '',
        rep_cidade: companyData?.cidade || '',
        rep_uf: companyData?.uf || '',
        rep_cep: companyData?.cep || ''
    };
    const logo = formatBase64(companyData?.logotipo, 'RepLogo'); // Base64 from empresa_status
    const industryLogo = formatBase64(order?.industry_logotipo || order?.for_locimagem || order?.for_logotipo);

    // Group items by discount
    const groupedItems = groupItemsByDiscount(items);

    // Determine page orientation based on model
    const isLandscape = [13, 17, 18, 23, 24].includes(modelNum);

    // Hide certain sections for reorder models
    const isReorderModel = [17, 18].includes(modelNum);

    // Select items renderer based on model
    const renderItems = () => {
        switch (modelNum) {
            case 2:
                return <ItemsModel2 groupedItems={groupedItems} />;
            case 3:
                return <ItemsModel3 groupedItems={groupedItems} order={order} />;
            case 4:
                return <ItemsModel4 groupedItems={groupedItems} order={order} />;
            case 5:
                return <ItemsModel5 groupedItems={groupedItems} order={order} />;
            case 7:
                return <ItemsModel7 groupedItems={groupedItems} />;
            case 8:
                return <ItemsModel8 groupedItems={groupedItems} order={order} />;
            case 9:
                return <ItemsModel9 groupedItems={groupedItems} order={order} />;
            case 10:
                return <ItemsModel10 groupedItems={groupedItems} />;
            case 11:
                return <ItemsModel11 groupedItems={groupedItems} />;
            case 12:
                return <ItemsModel12 groupedItems={groupedItems} />;
            case 13:
                return <ItemsModel13 groupedItems={groupedItems} />;
            case 14:
                return <ItemsModel14 groupedItems={groupedItems} order={order} />;
            default:
                return <ItemsModel1 groupedItems={groupedItems} />;
        }
    };

    // Select totals section based on model
    const renderTotals = () => {
        switch (modelNum) {
            case 2:
                return <TotalsSection2 order={order} items={items} />;
            case 3:
                return <TotalsSection3 order={order} items={items} />;
            case 4:
                return <TotalsSection3 order={order} items={items} />;
            case 5:
                return <TotalsSection5 order={order} items={items} />;
            case 7:
                return <TotalsSection7 order={order} items={items} />;
            case 8:
                return <TotalsSection3 order={order} items={items} />;
            case 9:
                return <TotalsSection9 order={order} items={items} />;
            case 10:
                return <TotalsSection10 order={order} items={items} />;
            case 11:
                return <TotalsSection11 order={order} items={items} />;
            case 12:
                return <TotalsSection12 order={order} items={items} />;
            case 13:
                return <TotalsSection13 order={order} items={items} />;
            case 14:
                return <TotalsSection14 order={order} items={items} />;
            default:
                return <TotalsSection order={order} items={items} />;
        }
    };

    return (
        <Document>
            <Page
                size="A4"
                orientation={isLandscape ? 'landscape' : 'portrait'}
                style={styles.page}
            >
                {/* Header */}
                <ReportHeader
                    order={order}
                    repInfo={repInfo}
                    logo={logo}
                    industryLogo={industryLogo}
                    modelNum={modelNum}
                />

                {/* Client Section - Includes Industry, Commercial data */}
                {modelNum !== 11 && modelNum !== 12 && modelNum !== 13 && modelNum !== 14 && <ClientSection order={order} modelNum={modelNum} />}

                {/* 3. Carrier, Billing and Obs - Only if modelNum != 10, 11, 12, 13, 14 and not reorder model */}
                {modelNum !== 10 && modelNum !== 11 && modelNum !== 12 && modelNum !== 13 && modelNum !== 14 && !isReorderModel && (
                    <>
                        {/* Commercial Data (for models that don't have it in ClientSection) */}
                        {[3, 4, 5, 7, 8, 9].includes(modelNum) && <CommercialSection order={order} />}

                        <View style={{ flexDirection: 'row', gap: 3 }}>
                            {!isReorderModel && (
                                <View style={{ flex: 1 }}>
                                    <BillingSection order={order} />
                                </View>
                            )}
                            <View style={{ flex: 1 }}>
                                <CarrierSection order={order} />
                            </View>
                        </View>
                        {modelNum !== 23 && modelNum !== 24 && (
                            <ObservationsSection order={order} />
                        )}
                        {modelNum === 24 && (
                            <ObservationsSection order={order} highlighted={true} />
                        )}
                    </>
                )}

                {/* Model 11 and 12 sections (centered titles and full boxes) */}
                {(modelNum === 11 || modelNum === 12) && (
                    <>
                        <Text style={styles.centeredSectionTitle}>DADOS DO CLIENTE</Text>
                        <View style={styles.sectionContentModel11}>
                            <ClientSection order={order} hideTitle={true} noBorder={true} modelNum={modelNum} />
                        </View>

                        <Text style={styles.centeredSectionTitle}>DADOS PARA COBRANÇA</Text>
                        <View style={styles.sectionContentModel11}>
                            <BillingSection order={order} hideTitle={true} noBorder={true} />
                        </View>

                        <Text style={styles.centeredSectionTitle}>TRANSPORTADORA</Text>
                        <View style={styles.sectionContentModel11}>
                            <CarrierSection order={order} hideTitle={true} noBorder={true} />
                        </View>
                    </>
                )}

                {/* Model 13 special client section */}
                {modelNum === 13 && (
                    <View style={{ borderWidth: 0.5, borderColor: '#000', borderStyle: 'solid', marginTop: 3, marginBottom: 3 }}>
                        <Text style={{ ...styles.centeredSectionTitle, marginTop: 0, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0 }}>DADOS DO CLIENTE</Text>
                        <View style={{ padding: 4 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>CNPJ: {formatCpfCnpj(order.client_cnpj || order.cli_cnpj)}</Text>
                                <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Inscrição: {order.cli_inscricao || ''}</Text>
                            </View>
                            <View style={{ flexDirection: 'row' }}>
                                <View style={{ flex: 1.5 }}><Text style={styles.label}>Razão social: </Text><Text style={styles.value}>{order.cli_nome}</Text></View>
                            </View>
                            <View style={{ flexDirection: 'row' }}>
                                <View style={{ flex: 1 }}><Text style={styles.label}>Endereço: </Text><Text style={styles.value}>{order.cli_endereco}</Text></View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 0.8 }}><Text style={styles.label}>Complemento: </Text><Text style={styles.value}>{order.cli_complemento}</Text></View>
                                <View style={{ flex: 1 }}><Text style={styles.label}>Bairro: </Text><Text style={styles.value}>{order.cli_bairro}</Text></View>
                                <View style={{ flex: 0.4 }}><Text style={styles.label}>Cx.postal: </Text><Text style={styles.value}>{order.cli_cxpostal}</Text></View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}><Text style={styles.label}>Cidade: </Text><Text style={styles.value}>{order.cli_cidade}</Text></View>
                                <View style={{ flex: 0.5 }}><Text style={styles.label}>Cep: </Text><Text style={styles.value}>{order.cli_cep} / {order.cli_uf}</Text></View>
                                <View style={{ flex: 0.5 }}><Text style={styles.label}>Fax: </Text><Text style={styles.value}>{order.cli_fax}</Text></View>
                                <View style={{ flex: 0.5 }}><Text style={{ ...styles.label, color: '#dc2626' }}>Suframa: </Text><Text style={styles.value}>{order.cli_suframa}</Text></View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}><Text style={styles.label}>Fone: </Text><Text style={styles.value}>({order.cli_ddd || ''}) {order.cli_fone}</Text></View>
                                <View style={{ flex: 0.8 }}><Text style={styles.label}>Comprador: </Text><Text style={styles.value}>{order.ped_comprador}</Text></View>
                                <View style={{ flex: 1.5 }}><Text style={styles.label}>E-mail: </Text><Text style={{ ...styles.value, textTransform: 'lowercase' }}>{order.cli_email}</Text></View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}><Text style={styles.label}>E-Mail NFe: </Text><Text style={{ ...styles.value, textTransform: 'lowercase' }}>{order.cli_emailnfe}</Text></View>
                                <View style={{ flex: 1 }}><Text style={{ ...styles.label, color: '#dc2626' }}>E-Mail financeiro: </Text><Text style={{ ...styles.value, color: '#dc2626', textTransform: 'lowercase' }}>{order.cli_emailfinanceiro}</Text></View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Model 14 special simple quote section */}
                {modelNum === 14 && (
                    <View style={{ borderWidth: 0.5, borderColor: '#000', borderStyle: 'solid', marginTop: 3, marginBottom: 3 }}>
                        <Text style={{ ...styles.centeredSectionTitle, marginTop: 0, borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0 }}>DADOS DO CLIENTE</Text>
                        <View style={{ padding: 5 }}>
                            <View style={{ flexDirection: 'row', marginBottom: 2 }}>
                                <Text style={{ ...styles.label, width: 80 }}>Razão social: </Text>
                                <Text style={{ ...styles.value, fontWeight: 'bold', fontSize: 9 }}>{order.cli_nome}</Text>
                            </View>
                            <View style={{ flexDirection: 'row' }}>
                                <View style={{ flex: 1, flexDirection: 'row' }}>
                                    <Text style={{ ...styles.label, width: 80 }}>Comprador: </Text>
                                    <Text style={styles.value}>{order.ped_comprador || ''}</Text>
                                </View>
                                <View style={{ flex: 1, flexDirection: 'row' }}>
                                    <Text style={styles.label}>E-mail: </Text>
                                    <Text style={{ ...styles.value, textTransform: 'lowercase' }}>{order.cli_email || ''}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* 4. Items Table */}
                {renderItems()}

                {/* 5. Totals */}
                {renderTotals()}

                {/* 6. Model 10 specific: Carrier and Obs at bottom */}
                {modelNum === 10 && (
                    <>
                        <CarrierSection order={order} />
                        <ObservationsSection order={order} />
                    </>
                )}

                {/* Footer */}
                <ReportFooter pageNumber={1} totalPages={1} />
            </Page>
        </Document>
    );
};

export default OrderPdfReport;
