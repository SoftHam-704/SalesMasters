import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 20, fontSize: 8, backgroundColor: '#FFFFFF' },
    headerBox: { borderWidth: 0.5, borderColor: '#000', flexDirection: 'row', padding: 5, marginBottom: 5, alignItems: 'center', minHeight: 60 },
    logoContainer: { width: 100, alignItems: 'center', justifyContent: 'center' },
    logo: { maxWidth: 90, maxHeight: 50 },
    titleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    reportTitle: { fontSize: 14, fontWeight: 'bold' },
    metaContainer: { width: 120, textAlign: 'right', fontSize: 7 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#eee', borderWidth: 0.5, borderColor: '#000' },
    tableRow: { flexDirection: 'row', borderLeftWidth: 0.5, borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#000', minHeight: 18, alignItems: 'center' },
    col1: { width: '6%', textAlign: 'center' },
    col2: { width: '24%', paddingLeft: 4 },
    col3: { width: '15%', paddingLeft: 4 },
    col4: { width: '15%', paddingLeft: 4 },
    col5: { width: '4%', textAlign: 'center' },
    col6: { width: '12%', paddingLeft: 4 },
    col7: { width: '24%', paddingLeft: 4 }
});

const CustomerReducedPdf = ({ data, companyData }) => {
    const currentDate = new Date().toLocaleString('pt-BR');

    const getLogo = (logoData) => {
        if (!logoData) return '';
        if (typeof logoData === 'string' && logoData.startsWith('data:image')) return logoData;
        return `data:image/png;base64,${logoData}`;
    };

    const logoUrl = getLogo(companyData?.logotipo);

    return (
        <Document title="Listagem de Clientes Reduzido">
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.headerBox}>
                    <View style={styles.logoContainer}>
                        {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : <View style={styles.logo} />}
                    </View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.reportTitle}>LISTAGEM DE CLIENTES (REDUZIDO)</Text>
                        <Text style={{ fontSize: 8, marginTop: 2 }}>{companyData?.nome || ''}</Text>
                    </View>
                    <View style={styles.metaContainer}>
                        <Text>Emissão: {currentDate}</Text>
                        <Text>Filtro: ATIVOS</Text>
                        <Text>Total: {data?.length || 0}</Text>
                    </View>
                </View>

                <View style={{ marginTop: 5 }}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.col1}>CÓD</Text>
                        <Text style={styles.col2}>RAZÃO SOCIAL</Text>
                        <Text style={styles.col3}>FANTASIA</Text>
                        <Text style={styles.col4}>CIDADE</Text>
                        <Text style={styles.col5}>UF</Text>
                        <Text style={styles.col6}>TELEFONE</Text>
                        <Text style={styles.col7}>E-MAIL</Text>
                    </View>

                    {(data || []).map((item) => (
                        <View key={item.cli_codigo} style={styles.tableRow} wrap={false}>
                            <Text style={styles.col1}>{item.cli_codigo}</Text>
                            <Text style={styles.col2}>{item.cli_nome}</Text>
                            <Text style={styles.col3}>{item.cli_nomred}</Text>
                            <Text style={styles.col4}>{item.cli_cidade}</Text>
                            <Text style={styles.col5}>{item.cli_uf}</Text>
                            <Text style={styles.col6}>{item.cli_fone1}</Text>
                            <Text style={styles.col7}>{item.cli_email}</Text>
                        </View>
                    ))}
                </View>
            </Page>
        </Document>
    );
};

export default CustomerReducedPdf;
