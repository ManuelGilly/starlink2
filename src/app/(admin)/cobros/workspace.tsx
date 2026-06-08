"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatUSD } from "@/lib/utils";
import { CobroForm } from "./cobro-form";

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

export type Row = {
  subscriptionId: string;
  clientId: string;
  clientName: string;
  planName: string;
  planCost: number;
  priceLocked: number;
  pago: {
    id: string;
    amount: number;
    starlinkCost: number | null;
    method: string;
    reference: string | null;
  } | null;
};

type Props = {
  rows: Row[];
  year: number;
  month: number; // 1-indexed
  periodoInicio: string;
  periodoFin: string;
  rate: number;
};

export function CobrosWorkspace({ rows, year, month, periodoInicio, periodoFin, rate }: Props) {
  const router = useRouter();
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);

  function navMes(delta: number) {
    let y = year;
    let m = month + delta;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    router.push(`/cobros?mes=${y}-${String(m).padStart(2, "0")}`);
  }

  const totalCobrado = rows.reduce((acc, r) => acc + (r.pago?.amount ?? 0), 0);
  const totalStarlink = rows.reduce((acc, r) => acc + (r.pago?.starlinkCost ?? 0), 0);
  const totalGanancia = totalCobrado - totalStarlink;
  const sinPago = rows.filter((r) => !r.pago).length;

  return (
    <div className="p-6 space-y-4">
      {/* Navegación de mes */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navMes(-1)}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="min-w-[180px] text-center text-base font-semibold">
          {MESES[month - 1]} {year}
        </span>
        <button
          onClick={() => navMes(1)}
          className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Cobrado
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xl font-bold">{formatUSD(totalCobrado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground">
              A Starlink
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xl font-bold">{formatUSD(totalStarlink)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Ganancia
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p
              className={`text-xl font-bold ${
                totalGanancia >= 0 ? "text-green-500" : "text-destructive"
              }`}
            >
              {formatUSD(totalGanancia)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Sin pago
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xl font-bold">{sinPago}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Precio plan</TableHead>
                <TableHead className="text-right">Pagó cliente</TableHead>
                <TableHead className="text-right">A Starlink</TableHead>
                <TableHead className="text-right">Ganancia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const ganancia =
                  row.pago != null
                    ? row.pago.amount - (row.pago.starlinkCost ?? 0)
                    : null;
                return (
                  <TableRow key={row.subscriptionId}>
                    <TableCell className="font-medium">{row.clientName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.planName}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatUSD(row.priceLocked)}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.pago ? formatUSD(row.pago.amount) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {row.pago?.starlinkCost != null
                        ? formatUSD(row.pago.starlinkCost)
                        : "—"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        ganancia != null
                          ? ganancia >= 0
                            ? "text-green-500"
                            : "text-destructive"
                          : ""
                      }`}
                    >
                      {ganancia != null ? formatUSD(ganancia) : "—"}
                    </TableCell>
                    <TableCell>
                      {row.pago ? (
                        <Badge variant="success">CONFIRMADO</Badge>
                      ) : (
                        <Badge variant="secondary">SIN PAGO</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!row.pago && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRow(row)}
                        >
                          Registrar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No hay suscripciones activas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de registro */}
      {selectedRow && (
        <CobroForm
          row={selectedRow}
          periodoInicio={periodoInicio}
          periodoFin={periodoFin}
          rate={rate}
          onClose={() => setSelectedRow(null)}
          onSuccess={() => {
            setSelectedRow(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
