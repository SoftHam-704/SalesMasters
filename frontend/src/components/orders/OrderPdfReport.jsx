import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontSize: 8,
        fontFamily: 'Helvetica',
        color: '#334155',
    },
    header: {
        flexDirection: 'row',
        border: '0.5pt solid #94a3b8',
        padding: 5,
        marginBottom: 3,
        alignItems: 'center',
    },
    logoBox: {
        width: 60,
        height: 35,
        border: '0.5pt solid #cbd5e1',
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
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        border: '0.5pt solid #94a3b8',
        padding: 3,
        marginBottom: 3,
    },
    infoItem: {
        width: '33.33%',
        marginBottom: 2,
    },
    label: {
        color: '#64748b',
        fontSize: 7,
    },
    value: {
        fontWeight: 'bold',
        fontSize: 8,
    },
    sectionTitle: {
        backgroundColor: '#e2e8f0',
        border: '0.5pt solid #94a3b8',
        textAlign: 'center',
        fontWeight: 'bold',
        padding: 1,
        fontSize: 8,
    },
    sectionContent: {
        border: '0.5pt solid #94a3b8',
        borderTopWidth: 0,
        padding: 3,
        marginBottom: 3,
    },
    gridRow: {
        flexDirection: 'row',
        marginBottom: 1,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#e2e8f0',
        border: '0.5pt solid #94a3b8',
        borderTopWidth: 0,
        fontWeight: 'bold',
        fontSize: 7,
    },
    tableRow: {
        flexDirection: 'row',
        borderLeft: '0.5pt solid #94a3b8',
        borderRight: '0.5pt solid #94a3b8',
        borderBottom: '0.5pt solid #cbd5e1',
        fontSize: 8,
    },
    // Column definitions
    colSq: { width: '3.5%', textAlign: 'center', borderRight: '0.5pt solid #94a3b8' },
    colProd: { width: '10%', borderRight: '0.5pt solid #94a3b8', paddingLeft: 2 },
    colRef: { width: '12%', borderRight: '0.5pt solid #94a3b8', paddingLeft: 2 },
    colDesc: { flex: 1, borderRight: '0.5pt solid #94a3b8', paddingLeft: 2 },
    colQtd: { width: '6%', textAlign: 'right', borderRight: '0.5pt solid #94a3b8', paddingRight: 2 },
    colVal: { width: '8%', textAlign: 'right', borderRight: '0.5pt solid #94a3b8', paddingRight: 2 },
    colTot: { width: '10%', textAlign: 'right', borderRight: '0.5pt solid #94a3b8', paddingRight: 2 },
    colTax: { width: '5%', textAlign: 'right', paddingRight: 2 },

    // Landscape specific columns
    colValL: { width: '7%', textAlign: 'right', borderRight: '0.5pt solid #94a3b8', paddingRight: 2 },
    colTotL: { width: '9%', textAlign: 'right', borderRight: '0.5pt solid #94a3b8', paddingRight: 2 },

    footer: {
        flexDirection: 'row',
        marginTop: 5,
        gap: 4,
    },
    footerBox: {
        flex: 1,
        border: '0.5pt solid #94a3b8',
        padding: 3,
    },
    footerRow: {
        flexDirection: 'row',
        borderBottom: '0.5pt solid #e2e8f0',
        paddingVertical: 1,
    },
    obsTitle: {
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 7,
        color: '#64748b',
        borderBottom: '0.5pt solid #e2e8f0',
        marginBottom: 2,
    }
});

const fv = (v) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
const fd = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';

const OrderPdfReport = ({ model, order, items, companyData }) => {
    const totalBruto = items.reduce((acc, it) => acc + (parseFloat(it.ite_totbruto) || 0), 0);
    const totalLiquido = items.reduce((acc, it) => acc + (parseFloat(it.ite_totliquido) || 0), 0);
    const totalIPIVal = items.reduce((acc, it) => acc + (parseFloat(it.ite_ipi) || 0) * (parseInt(it.ite_quant) || 0), 0);
    const totalSTVal = items.reduce((acc, it) => acc + (parseFloat(it.ite_st) || 0) * (parseInt(it.ite_quant) || 0), 0);
    const totalQuantidade = items.reduce((acc, it) => acc + (parseInt(it.ite_quant) || 0), 0);
    const totalComImpostos = totalLiquido + totalIPIVal + totalSTVal;

    const isLandscape = (model === '26' || model === '27');

    const getDiscountString = (item) => {
        const discounts = [
            item.ite_des1, item.ite_des2, item.ite_des3, item.ite_des4, item.ite_des5,
            item.ite_des6, item.ite_des7, item.ite_des8, item.ite_des9, item.ite_des10
        ].filter(d => d && parseFloat(d) !== 0);

        if (item.ite_promocao === 'S' || discounts.length === 0) return 'ITENS EM PROMOÇÃO';
        return discounts.map(d => `${fv(d)}%`).join('+');
    };

    const groupItemsByDiscount = (items) => {
        const groups = {};
        items.forEach(item => {
            const key = getDiscountString(item);
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });
        return groups;
    };

    const groupedItems = groupItemsByDiscount(items);
    let globalSeq = 0;

    return (
        <Document>
            <Page size="A4" orientation={isLandscape ? 'landscape' : 'portrait'} style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoBox}>
                        {companyData?.logotipo && (
                            <Image src={`http://localhost:3005/api/image?path=${encodeURIComponent(companyData.logotipo)}`} style={{ maxWidth: '90%', maxHeight: '90%' }} />
                        )}
                    </View>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{companyData?.nome || 'REPRESENTAÇÃO'}</Text>
                        <Text style={{ fontSize: 7 }}>CNPJ: {companyData?.cnpj || '-'} | Fones: {companyData?.fones || '-'}</Text>
                        <Text style={{ fontSize: 7 }}>{companyData?.endereco} {companyData?.bairro} - {companyData?.cidade}/{companyData?.uf}</Text>
                    </View>
                    <View style={styles.logoBox}>
                        <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{order.for_nomered || 'IND'}</Text>
                    </View>
                </View>

                {/* Industry Bar */}
                <View style={styles.industryBar}>
                    <Text>{order.for_nome || 'INDÚSTRIA'}</Text>
                </View>

                {/* Info Bar */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}><Text style={styles.label}>Cotação nº:</Text><Text style={styles.value}>{order.ped_pedido}</Text></View>
                    <View style={styles.infoItem}><Text style={styles.label}>Nº ped. cliente:</Text><Text style={styles.value}>{order.ped_nffat || '-'}</Text></View>
                    <View style={styles.infoItem}><Text style={styles.label}>Data:</Text><Text style={styles.value}>{fd(order.ped_data)}</Text></View>
                    <View style={styles.infoItem}><Text style={styles.label}>Lista:</Text><Text style={{ ...styles.value, color: '#1d4ed8' }}>{order.ped_tabela || 'LISTA ATUAL'}</Text></View>
                    <View style={styles.infoItem}><Text style={styles.label}>Cond. Pagto:</Text><Text style={{ ...styles.value, color: '#1d4ed8' }}>{order.ped_condpag || '-'}</Text></View>
                    <View style={styles.infoItem}><Text style={styles.label}>Frete:</Text><Text style={{ ...styles.value, color: '#dc2626' }}>{order.ped_tipofrete === 'F' ? 'FOB' : 'CIF'}</Text></View>
                </View>

                {/* Client Data */}
                <Text style={styles.sectionTitle}>DADOS DO CLIENTE</Text>
                <View style={styles.sectionContent}>
                    <View style={styles.gridRow}>
                        <View style={{ flex: 1.5 }}><Text style={styles.label}>Razão Social:</Text><Text style={styles.value}>{order.cli_nome}</Text></View>
                        <View style={{ flex: 1 }}><Text style={styles.label}>CNPJ:</Text><Text style={styles.value}>{order.cli_cnpj}</Text></View>
                        <View style={{ flex: 0.8 }}><Text style={styles.label}>Inscrição:</Text><Text style={styles.value}>{order.cli_inscricao}</Text></View>
                    </View>
                    <View style={styles.gridRow}>
                        <View style={{ flex: 1.5 }}><Text style={styles.label}>Endereço:</Text><Text style={{ fontSize: 8 }}>{order.cli_endereco} - {order.cli_bairro}</Text></View>
                        <View style={{ flex: 1 }}><Text style={styles.label}>Cidade/UF:</Text><Text style={{ fontSize: 8 }}>{order.cli_cidade} - {order.cli_uf}</Text></View>
                        <View style={{ flex: 0.8 }}><Text style={styles.label}>CEP:</Text><Text style={styles.value}>{order.cli_cep}</Text></View>
                    </View>
                </View>

                {/* Transportadora */}
                <Text style={styles.sectionTitle}>TRANSPORTADORA</Text>
                <View style={styles.sectionContent}>
                    <View style={styles.gridRow}>
                        <View style={{ flex: 1.5 }}><Text style={styles.label}>Nome:</Text><Text style={styles.value}>{order.tra_nome || '-'}</Text></View>
                        <View style={{ flex: 1 }}><Text style={styles.label}>CNPJ:</Text><Text style={styles.value}>{order.tra_cgc || '-'}</Text></View>
                        <View style={{ flex: 0.8 }}><Text style={styles.label}>Fone:</Text><Text style={styles.value}>{order.tra_fone || '-'}</Text></View>
                    </View>
                </View>

                {/* Items */}
                {Object.entries(groupedItems).map(([discountKey, groupItems], groupIndex) => (
                    <View key={groupIndex} style={{ marginBottom: 3 }} wrap={false}>
                        <View style={{ backgroundColor: '#f1f5f9', padding: 2, border: '0.5pt solid #94a3b8' }}>
                            <Text style={{ fontWeight: 'bold', fontSize: 7 }}>Descontos: {discountKey}</Text>
                        </View>
                        <View style={styles.tableHeader}>
                            <Text style={styles.colSq}>Sq</Text>
                            <Text style={styles.colProd}>Produto</Text>
                            <Text style={styles.colRef}>Referência</Text>
                            <Text style={styles.colDesc}>Descrição</Text>
                            <Text style={styles.colQtd}>Qtd</Text>
                            {model === '26' || model === '27' ? (
                                <>
                                    <Text style={styles.colValL}>Bruto</Text>
                                    <Text style={styles.colValL}>Líquido</Text>
                                    <Text style={styles.colValL}>C/Imposto</Text>
                                    <Text style={styles.colTotL}>Total</Text>
                                    <Text style={styles.colTax}>ST</Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.colVal}>Bruto</Text>
                                    <Text style={styles.colVal}>Líquido</Text>
                                    <Text style={styles.colTot}>Total</Text>
                                </>
                            )}
                            <Text style={styles.colTax}>IPI</Text>
                        </View>
                        {groupItems.map((item, idx) => {
                            globalSeq++;
                            const unitComImpostos = (parseFloat(item.ite_puniliq) || 0) + (parseFloat(item.ite_ipi) || 0) + (parseFloat(item.ite_st) || 0);
                            return (
                                <View key={idx} style={styles.tableRow} wrap={false}>
                                    <Text style={styles.colSq}>{globalSeq}</Text>
                                    {/* wrapping false specifically for product code as requested */}
                                    <Text style={{ ...styles.colProd, color: '#dc2626', fontWeight: 'bold' }}>{item.ite_produto}</Text>
                                    <Text style={styles.colRef}>{item.ite_embuch || '-'}</Text>
                                    <Text style={styles.colDesc}>{item.ite_nomeprod}</Text>
                                    <Text style={{ ...styles.colQtd, fontWeight: 'bold' }}>{item.ite_quant}</Text>
                                    {model === '26' || model === '27' ? (
                                        <>
                                            <Text style={styles.colValL}>{fv(item.ite_puni)}</Text>
                                            <Text style={styles.colValL}>{fv(item.ite_puniliq)}</Text>
                                            <Text style={styles.colValL}>{fv(unitComImpostos)}</Text>
                                            <Text style={{ ...styles.colTotL, fontWeight: 'bold' }}>{fv(item.ite_totliquido)}</Text>
                                            <Text style={styles.colTax}>{fv(item.ite_st || 0)}</Text>
                                        </>
                                    ) : (
                                        <>
                                            <Text style={styles.colVal}>{fv(item.ite_puni)}</Text>
                                            <Text style={styles.colVal}>{fv(item.ite_puniliq)}</Text>
                                            <Text style={{ ...styles.colTot, fontWeight: 'bold' }}>{fv(item.ite_totliquido)}</Text>
                                        </>
                                    )}
                                    <Text style={styles.colTax}>{fv(item.ite_ipi || 0)}</Text>
                                </View>
                            );
                        })}
                    </View>
                ))}

                {/* Grand Total Footer */}
                <View style={styles.footer} wrap={false}>
                    <View style={styles.footerBox}>
                        <View style={styles.footerRow}>
                            <Text style={{ flex: 1 }}>Total Líquido:</Text>
                            <Text style={{ fontWeight: 'bold' }}>{fv(totalLiquido)}</Text>
                            <Text style={{ flex: 1, marginLeft: 10 }}>Qtd. Itens:</Text>
                            <Text style={{ fontWeight: 'bold' }}>{items.length}</Text>
                        </View>
                        <View style={styles.footerRow}>
                            <Text style={{ flex: 1 }}>Impostos (IPI+ST):</Text>
                            <Text style={{ fontWeight: 'bold' }}>{fv(totalComImpostos - totalLiquido)}</Text>
                            <Text style={{ flex: 1, marginLeft: 10 }}>Qtd. Total:</Text>
                            <Text style={{ fontWeight: 'bold' }}>{totalQuantidade}</Text>
                        </View>
                        <View style={{ ...styles.footerRow, borderBottomWidth: 0, marginTop: 2 }}>
                            <Text style={{ flex: 1, fontSize: 9 }}>TOTAL COM IMPOSTOS:</Text>
                            <Text style={{ fontWeight: 'bold', color: '#10b981', fontSize: 9 }}>{fv(totalComImpostos)}</Text>
                            <Text style={{ flex: 1, marginLeft: 10 }}>Vendedor:</Text>
                            <Text style={{ fontWeight: 'bold', color: '#dc2626' }}>{order.ven_nome?.split(' ')[0]}</Text>
                        </View>
                    </View>
                    <View style={{ ...styles.footerBox, flex: 0.8 }}>
                        <Text style={styles.obsTitle}>OBSERVAÇÕES GERAIS</Text>
                        <Text style={{ fontSize: 7, lineHeight: 1.2 }}>{order.ped_obs || order.cli_obspedido || '-'}</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default OrderPdfReport;
