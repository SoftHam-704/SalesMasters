import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 8, backgroundColor: '#FFFFFF' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottom: '1pt solid #000',
        paddingBottom: 10,
        marginBottom: 20
    },
    companyInfo: {
        flexDirection: 'column'
    },
    companyName: {
        fontSize: 12,
        fontWeight: 'bold'
    },
    reportTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 10
    },
    table: {
        display: 'table',
        width: 'auto',
        marginTop: 10
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderBottom: '1pt solid #000',
        fontWeight: 'bold',
        padding: 4
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '0.5pt solid #eee',
        padding: 4
    },
    col1: { width: '10%' },
    col2: { width: '40%' },
    col3: { width: '30%' },
    col4: { width: '10%' },
    col5: { width: '10%' },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        borderTop: '1pt solid #eee',
        paddingTop: 5,
        fontSize: 7,
        color: '#666'
    }
});

const CustomerSelectablePdf = ({ data, companyData, filterInfo }) => {
    const currentDate = new Date().toLocaleString('pt-BR');

    return (
        <Document title="Relação de Clientes">
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{companyData?.nome || 'SalesMasters'}</Text>
                        <Text>{companyData?.endereco || ''}</Text>
                        <Text>{companyData?.telefone || ''}</Text>
                    </View>
                    <View style={{ textAlign: 'right' }}>
                        <Text>Data: {currentDate}</Text>
                        <Text>Filtro: {filterInfo || 'Geral'}</Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.reportTitle}>RELAÇÃO DE CLIENTES</Text>

                {/* Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.col1}>CÓDIGO</Text>
                        <Text style={styles.col2}>CLIENTE / NOME FANTASIA</Text>
                        <Text style={styles.col3}>CIDADE</Text>
                        <Text style={styles.col4}>UF</Text>
                        <Text style={styles.col5}>STATUS</Text>
                    </View>

                    {data.map((item) => (
                        <View key={item.cli_codigo} style={styles.tableRow} wrap={false}>
                            <Text style={styles.col1}>{item.cli_codigo}</Text>
                            <View style={styles.col2}>
                                <Text style={{ fontWeight: 'bold' }}>{item.cli_nome}</Text>
                                <Text style={{ color: '#666', fontSize: 7 }}>{item.cli_nomred || '-'}</Text>
                            </View>
                            <Text style={styles.col3}>{item.cli_cidade}</Text>
                            <Text style={styles.col4}>{item.cli_uf}</Text>
                            <Text style={styles.col5}>{item.cli_tipopes === 'A' ? 'Ativo' : 'Inativo'}</Text>
                        </View>
                    ))}
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Clube do Empreendedor - SoftHam Sistemas - Relatório gerado em {currentDate} - Página 1 de 1
                </Text>
            </Page>
        </Document>
    );
};

export default CustomerSelectablePdf;
