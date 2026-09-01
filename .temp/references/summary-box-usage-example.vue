<!--
  @description
  Grid of summary cards showing label, amount, and optional badge; supports loading state, link/hover, and color variants (e.g. green, red, blue, orange).
-->
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import SummaryBox from "./SummaryBox.vue";
import { css, MpText, MpTooltip, MpIcon, MpButton } from "@mekari/pixel3";
import { ref, onMounted } from "vue";

const state = ref({
    isLoading: true,
    isActive: false,
    salesFilter: {
        card1: false,
        card2: false,
    },
    purchaseFilter: {
        card1: false,
        card2: false,
    },
    expenseFilter: {
        card1: false,
        card2: false,
        card3: false,
    },
    contactFilter: {
        card1: false,
        card2: false,
        card3: false,
    },
});

function handleClick(category: any, key: any, message: any) {
    (state.value as any)[category][key] = !(state.value as any)[category][key];
}

onMounted(() => {
    setTimeout(() => {
        state.value.isLoading = false;
    }, 1000);
});
</script>

<template>
    <div :class="css({ display: 'grid', gap: '16', p: '8' })">
        <!-- CASH & BANK -->
        <div>
            <MpText size="h2" weight="regular">CASH & BANK</MpText>

            <div
                :class="
                    css({
                        display: 'grid',
                        gridTemplateColumns: '4',
                        gap: '4',
                        mt: 2,
                    })
                "
            >
                <SummaryBox
                    as="a"
                    href="https://mekari.com/"
                    is-hoverable
                    variant="green"
                    label="Pemasukan 30 hari mendatang"
                    badge="100"
                    amount="Rp10.000.000.000,00"
                    :isLoading="state.isLoading"
                />
                <SummaryBox
                    as="a"
                    href="https://mekari.com/"
                    is-hoverable
                    variant="red"
                    label="Pengeluaran 30 hari mendatang"
                    badge="100"
                    amount="Rp10.000.000,00"
                    :isLoading="state.isLoading"
                />
                <SummaryBox
                    variant="blue"
                    label="Saldo kas"
                    badge="10.000"
                    amount="Rp10.000.000,00"
                    :isLoading="state.isLoading"
                />
                <SummaryBox
                    variant="orange"
                    label="Saldo kartu kredit"
                    badge="0"
                    amount="Rp10.000.000,00"
                    :isLoading="state.isLoading"
                />
            </div>
        </div>

        <!-- SALES -->
        <div>
            <MpText size="h2" weight="regular">SALES</MpText>

            <div
                :class="
                    css({
                        display: 'grid',
                        gridTemplateColumns: '4',
                        gap: '4',
                        mt: 2,
                    })
                "
            >
                <SummaryBox
                    variant="orange"
                    label="Penjualan belum dibayar"
                    badge="100"
                    amount="Rp10.000.000,00"
                    is-filter
                    :is-active="state.salesFilter.card1"
                    @click="
                        handleClick(
                            'salesFilter',
                            'card1',
                            'Penjualan belum di bayar',
                        )
                    "
                    :isLoading="state.isLoading"
                />
                <SummaryBox
                    variant="red"
                    label="Penjualan jatuh tempo"
                    badge="100"
                    amount="Rp10.000.000,00"
                    is-filter
                    :is-active="state.salesFilter.card2"
                    @click="
                        handleClick(
                            'salesFilter',
                            'card2',
                            'Penjualan jatuh tempo',
                        )
                    "
                    :isLoading="state.isLoading"
                />
                <SummaryBox
                    as="a"
                    href="https://mekari.com/"
                    is-hoverable
                    variant="green"
                    label="Pelunasan diterima 30 hari terakhir"
                    badge="10.000"
                    amount="Rp10.000.000,00"
                    :isLoading="state.isLoading"
                />
                <SummaryBox
                    as="a"
                    href="https://mekari.com/"
                    is-hoverable
                    variant="gray"
                    labelSrc="https://res.cloudinary.com/uxe-mekari/image/upload/v1678247306/jurnal/logo-mekari-pay-default_trv3sh.svg"
                    amount="Rp10.000.000,00"
                    :isLoading="state.isLoading"
                />
            </div>
        </div>

        <!-- PUCHASE -->
        <div>
            <MpText size="h2" weight="regular">PURCHASE</MpText>

            <div
                :class="
                    css({
                        display: 'grid',
                        gridTemplateColumns: '3',
                        gap: '4',
                        mt: 2,
                    })
                "
            >
                <SummaryBox
                    variant="orange"
                    label="Pembelian belum dibayar"
                    badge="100"
                    amount="Rp10.000.000,00"
                    is-filter
                    :is-active="state.purchaseFilter.card1"
                    @click="
                        handleClick(
                            'purchaseFilter',
                            'card1',
                            'Pembelian belum dibayar',
                        )
                    "
                    :isLoading="state.isLoading"
                />
                <SummaryBox
                    variant="red"
                    label="Pembelian jatuh tempo"
                    badge="100"
                    amount="Rp10.000.000,00"
                    is-filter
                    :is-active="state.purchaseFilter.card2"
                    @click="
                        handleClick(
                            'purchaseFilter',
                            'card2',
                            'Pembelian jatuh tempo',
                        )
                    "
                    :isLoading="state.isLoading"
                />
                <SummaryBox
                    as="a"
                    href="https://mekari.com/"
                    is-hoverable
                    variant="green"
                    label="Pelunasan dibayar 30 hari terakhir"
                    badge="10.000"
                    amount="Rp10.000.000,00"
                    :isLoading="state.isLoading"
                />
            </div>
        </div>

        <!-- EXPENSE -->
        <div>
            <MpText size="h2" weight="regular">EXPENSE</MpText>

            <div
                :class="
                    css({
                        display: 'grid',
                        gridTemplateColumns: '3',
                        gap: '4',
                        mt: 2,
                    })
                "
            >
                <SummaryBox
                    variant="blue"
                    label="Total biaya bulan ini"
                    badge="100"
                    amount="Rp10.000.000,00"
                    is-filter
                    :is-active="state.expenseFilter.card1"
                    @click="
                        handleClick(
                            'expenseFilter',
                            'card1',
                            'Total biaya bulan ini',
                        )
                    "
                    :isLoading="state.isLoading"
                />
                <SummaryBox
                    variant="green"
                    label="Biaya 30 hari terakhir"
                    badge="100"
                    amount="Rp10.000.000,00"
                    is-filter
                    :is-active="state.expenseFilter.card2"
                    @click="
                        handleClick(
                            'expenseFilter',
                            'card2',
                            'Biaya 30 hari terakhir',
                        )
                    "
                    :isLoading="state.isLoading"
                />
                <SummaryBox
                    variant="orange"
                    label="Biaya belum dibayar"
                    badge="10.000"
                    amount="Rp10.000.000,00"
                    is-filter
                    :is-active="state.expenseFilter.card3"
                    @click="
                        handleClick(
                            'expenseFilter',
                            'card3',
                            'Biaya belum dibayar',
                        )
                    "
                    :isLoading="state.isLoading"
                />
            </div>
        </div>

        <!-- CONTACT -->
        <div>
            <MpText size="h2" weight="regular">CONTACT</MpText>

            <div
                :class="
                    css({
                        display: 'grid',
                        gridTemplateColumns: '3',
                        gap: '4',
                        mt: 2,
                    })
                "
            >
                <SummaryBox
                    variant="orange"
                    label="Piutang belum dibayar"
                    badge="100"
                    amount="Rp10.000.000,00"
                    is-filter
                    :is-active="state.contactFilter.card1"
                    @click="
                        handleClick(
                            'contactFilter',
                            'card1',
                            'Piutang belum dibayar',
                        )
                    "
                    :isLoading="state.isLoading"
                />
                <SummaryBox
                    variant="red"
                    label="Piutang jatuh tempo"
                    badge="100"
                    amount="Rp10.000.000,00"
                    is-filter
                    :is-active="state.contactFilter.card2"
                    @click="
                        handleClick(
                            'contactFilter',
                            'card2',
                            'Piutang jatuh tempo',
                        )
                    "
                    :isLoading="state.isLoading"
                />
                <SummaryBox
                    variant="blue"
                    label="Kredit memo"
                    badge="10.000"
                    amount="Rp10.000.000,00"
                    is-filter
                    :is-active="state.contactFilter.card3"
                    @click="
                        handleClick('contactFilter', 'card3', 'Kredit memo')
                    "
                    :isLoading="state.isLoading"
                />
            </div>
        </div>

        <!-- PRODUCT -->
        <div>
            <MpText size="h2" weight="regular">PRODUCT</MpText>

            <div
                :class="
                    css({
                        display: 'grid',
                        gridTemplateColumns: '4',
                        gap: '4',
                        mt: 2,
                    })
                "
            >
                <SummaryBox
                    variant="green"
                    label="Stok tersedia"
                    caption="Total produk"
                    amount="10.000"
                    :isLoading="state.isLoading"
                >
                    <template #top-right-content>
                        <MpTooltip label="Label">
                            <MpIcon name="doc" style="cursor: pointer" />
                        </MpTooltip>
                    </template>
                </SummaryBox>
                <SummaryBox
                    variant="orange"
                    label="Stok segera habis"
                    caption="Total produk"
                    amount="800"
                    :isLoading="state.isLoading"
                >
                    <template #top-right-content>
                        <MpTooltip label="Label">
                            <MpIcon name="doc" style="cursor: pointer" />
                        </MpTooltip>
                    </template>
                </SummaryBox>
                <SummaryBox
                    variant="red"
                    label="Stok habis"
                    caption="Total produk"
                    amount="200"
                    :isLoading="state.isLoading"
                >
                    <template #top-right-content>
                        <MpTooltip label="Label">
                            <MpIcon name="doc" style="cursor: pointer" />
                        </MpTooltip>
                    </template>
                </SummaryBox>
                <SummaryBox
                    variant="blue"
                    label="Gudang"
                    caption="Total produk"
                    amount="1.000"
                    :isLoading="state.isLoading"
                >
                    <template #top-right-content>
                        <MpTooltip label="Label">
                            <MpIcon name="doc" style="cursor: pointer" />
                        </MpTooltip>
                    </template>
                </SummaryBox>
            </div>
        </div>

        <!-- EXPORT IMPORT -->
        <div>
            <MpText size="h2" weight="regular">EXPORT IMPORT</MpText>

            <div
                :class="
                    css({
                        display: 'grid',
                        gridTemplateColumns: '3',
                        gap: '4',
                        mt: 2,
                    })
                "
            >
                <SummaryBox
                    variant="gray"
                    label="Total baris impor"
                    amount="4 baris"
                    :isLoading="state.isLoading"
                >
                    <template #bottom-right-content>
                        <MpButton size="sm" variant="secondary">Unduh</MpButton>
                    </template>
                </SummaryBox>
                <SummaryBox
                    variant="gray"
                    label="Gagal impor"
                    amount="3 baris"
                    :isLoading="state.isLoading"
                >
                    <template #bottom-right-content>
                        <div :class="css({ display: 'flex', gap: '2' })">
                            <MpButton size="sm" variant="ghost"
                                >Lihat error</MpButton
                            >
                            <MpButton size="sm" variant="secondary"
                                >Perbaiki</MpButton
                            >
                        </div>
                    </template>
                </SummaryBox>
                <SummaryBox
                    variant="gray"
                    label="Berhasil impor"
                    amount="1 baris"
                    :isLoading="state.isLoading"
                >
                </SummaryBox>
            </div>
        </div>
    </div>
</template>
