
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Job, JobStatus, PaymentType } from '@/lib/types';
import { format, startOfMonth, startOfYear, endOfYear, eachMonthOfInterval, eachYearOfInterval } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/dates';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';


const jobStatuses: (JobStatus | 'all' | 'unpaid')[] = ['all', 'new', 'scheduled', 'completed', 'unpaid', 'partially-paid', 'paid'];

const StatCard = ({ title, value, prefix }: { title: string, value: string | number, prefix?: string }) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}{typeof value === 'number' ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
        </div>
      </CardContent>
    </Card>
);

const SalesReportTab = () => {
  const { navigateTo, showAppModal } = useAppContext();
  const isMobile = useIsMobile();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all' | 'unpaid'>('all');
  const [chartView, setChartView] = useState<'monthly' | 'yearly'>('monthly');

  const filteredJobs = useMemo(() => {
    return allJobs
      .filter(job => {
        if (job.archivedAt || job.isQuote) return false;

        if (dateRange.from && dateRange.to) {
          const startDate = new Date(dateRange.from);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(dateRange.to);
          endDate.setHours(23, 59, 59, 999);
          const jobDate = new Date(job.createdAt);
          if (jobDate < startDate || jobDate > endDate) return false;
        }
        
        if (statusFilter === 'unpaid') {
            return job.status === 'completed' || job.status === 'billed';
        } else if (statusFilter !== 'all' && job.status !== statusFilter) {
            return false;
        }
        
        return true;
      })
      .sort((a,b) => (b.createdAt as any) - (a.createdAt as any));
  }, [allJobs, dateRange, statusFilter]);
  
  const chartData = useMemo(() => {
    if (chartView === 'monthly') {
        const start = dateRange.from ? startOfMonth(dateRange.from) : startOfMonth(new Date());
        const end = dateRange.to || new Date();
        const months = eachMonthOfInterval({ start, end });
        
        const monthlySales = months.map(month => {
            const monthStr = format(month, 'MMM yyyy');
            const sales = filteredJobs.reduce((acc, job) => {
                const jobDate = new Date(job.createdAt);
                if (format(jobDate, 'MMM yyyy') === monthStr) {
                    return acc + (job.totalAmount || 0);
                }
                return acc;
            }, 0);
            return { name: format(month, 'MMM'), totalSales: sales };
        });
        return monthlySales;
    }
    
    if (chartView === 'yearly') {
        const start = dateRange.from ? startOfYear(dateRange.from) : startOfYear(new Date());
        const end = dateRange.to || new Date();
        const years = eachYearOfInterval({ start, end });

        const yearlySales = years.map(year => {
            const yearStr = format(year, 'yyyy');
            const sales = filteredJobs.reduce((acc, job) => {
                const jobDate = new Date(job.createdAt);
                 if (format(jobDate, 'yyyy') === yearStr) {
                    return acc + (job.totalAmount || 0);
                }
                return acc;
            }, 0);
            return { name: yearStr, totalSales: sales };
        });
        return yearlySales;
    }

    return [];
  }, [filteredJobs, dateRange, chartView]);

  const reportStats = useMemo(() => {
    const totalRevenue = filteredJobs.reduce((sum, job) => sum + (job.totalAmount || 0), 0);
    const totalJobs = filteredJobs.length;
    const averageJobValue = totalJobs > 0 ? totalRevenue / totalJobs : 0;
    return { totalRevenue, totalJobs, averageJobValue };
  }, [filteredJobs]);

  const setDatePreset = (preset: 'today' |'month' | 'quarter' | 'year') => {
    const today = new Date();
    let fromDate: Date;
    switch(preset) {
        case 'today': fromDate = today; break;
        case 'month': fromDate = startOfMonth(new Date()); break;
        case 'quarter': fromDate = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1); break;
        case 'year': fromDate = new Date(today.getFullYear(), 0, 1); break;
    }
    setDateRange({ from: fromDate, to: today });
  };
  
  const chartConfig = {
      totalSales: {
        label: "Total Sales",
        color: "hsl(var(--primary))",
      },
  };
  
  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg">
            <div className='flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2'>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button id="date-from" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, "PPP") : <span>Start Date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateRange.from} onSelect={(date) => setDateRange(prev => ({...prev, from: date}))} initialFocus /></PopoverContent>
                </Popover>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button id="date-to" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, "PPP") : <span>End Date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateRange.to} onSelect={(date) => setDateRange(prev => ({...prev, to: date}))} initialFocus /></PopoverContent>
                </Popover>
            </div>
             <div className="w-full md:w-auto md:border-l md:pl-4">
                <Select value={statusFilter} onValueChange={(value: JobStatus | 'all' | 'unpaid') => setStatusFilter(value)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        {jobStatuses.map(status => (
                            <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
         <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDatePreset('today')}>Today</Button>
            <Button variant="ghost" size="sm" onClick={() => setDatePreset('month')}>This Month</Button>
            <Button variant="ghost" size="sm" onClick={() => setDatePreset('quarter')}>This Quarter</Button>
            <Button variant="ghost" size="sm" onClick={() => setDatePreset('year')}>This Year</Button>
        </div>

        {loading ? (
            <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
            <>
                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard title="Total Revenue" value={reportStats.totalRevenue} prefix="$" />
                    <StatCard title="Total Jobs" value={reportStats.totalJobs} />
                    <StatCard title="Average Job Value" value={reportStats.averageJobValue} prefix="$" />
                </div>
                
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                        <div>
                            <CardTitle>Sales Chart</CardTitle>
                            <CardDescription>
                                A visual representation of sales in the selected date range.
                            </CardDescription>
                        </div>
                        <Select value={chartView} onValueChange={(v) => setChartView(v as 'monthly' | 'yearly')}>
                            <SelectTrigger className="w-full sm:w-[120px] mt-2 sm:mt-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                             <ResponsiveContainer>
                                <BarChart data={chartData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                    <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                                    <Tooltip
                                        cursor={false}
                                        content={<ChartTooltipContent
                                            formatter={(value) => `$${(value as number).toLocaleString()}`}
                                            indicator="dot"
                                        />}
                                    />
                                    <Bar dataKey="totalSales" fill="var(--color-totalSales)" radius={4} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                <h3 className="text-lg font-semibold pt-4">Jobs Included in Report ({filteredJobs.length})</h3>
                {isMobile ? (
                  <div className="space-y-4">
                    {filteredJobs.map(job => (
                      <Card key={job.id} onClick={() => navigateTo('jobDetail', job)}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold">{job.customerName}</p>
                            <p className="font-bold">${(job.totalAmount || 0).toFixed(2)}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">ID: {job.jobId}</p>
                          <p className="text-sm text-muted-foreground capitalize">Status: {job.status}</p>
                          <p className="text-xs text-muted-foreground">Date: {formatDateTime(job.createdAt)}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-md">
                      <Table>
                          <TableHeader><TableRow><TableHead>Job ID</TableHead><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                          <TableBody>
                              {filteredJobs.length > 0 ? (
                                  filteredJobs.map(job => (
                                      <TableRow key={job.id} onClick={() => navigateTo('jobDetail', job)} className="cursor-pointer">
                                          <TableCell className="font-medium">{job.jobId}</TableCell>
                                          <TableCell>{formatDateTime(job.createdAt)}</TableCell>
                                          <TableCell>{job.customerName}</TableCell>
                                          <TableCell className="capitalize">{job.status}</TableCell>
                                          <TableCell className="text-right">${(job.totalAmount || 0).toFixed(2)}</TableCell>
                                      </TableRow>
                                  ))
                              ) : (
                                  <TableRow><TableCell colSpan={5} className="h-24 text-center">No jobs found for the selected filters.</TableCell></TableRow>
                              )}
                          </TableBody>
                      </Table>
                  </div>
                )}
            </>
        )}
    </div>
  );
};

const SalesTaxReportTab = () => {
    const { showAppModal, navigateTo, userProfile } = useAppContext();
    const isMobile = useIsMobile();
    const [allJobs, setAllJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
      from: startOfMonth(new Date()),
      to: new Date(),
    });

    const taxedJobs = useMemo(() => {
        return allJobs
          .filter(job => {
            if (job.archivedAt || !['completed', 'billed', 'partially-paid', 'paid'].includes(job.status)) {
                return false;
            }
            if (dateRange.from && dateRange.to) {
                const startDate = new Date(dateRange.from);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(dateRange.to);
                endDate.setHours(23, 59, 59, 999);
                const jobDate = new Date(job.createdAt);
                if (jobDate < startDate || jobDate > endDate) return false;
            }
            return true;
          })
          .sort((a,b) => (b.createdAt as any) - (a.createdAt as any));
    }, [allJobs, dateRange]);
    
    const taxReportStats = useMemo(() => {
        let totalNetSales = 0;
        let totalTaxCollected = 0;

        taxedJobs.forEach(job => {
            const subtotal = (job.jobItems || []).reduce((sum, item) => sum + (item.quantity * item.price), 0);
            const discount = (job.jobItems || []).reduce((sum, item) => {
                const itemTotal = item.quantity * item.price;
                if (item.discountType === '%') return sum + (itemTotal * (item.discountValue || 0) / 100);
                return sum + ((item.discountValue || 0) * item.quantity);
            }, 0);
            const taxableAmount = subtotal - discount;
            const tax = job.applySalesTax && job.totalAmount > 0 && taxableAmount > 0 ? (job.totalAmount - taxableAmount) : 0;
            
            totalNetSales += taxableAmount;
            totalTaxCollected += tax > 0 ? tax : 0;
        });

        return { totalNetSales, totalTaxCollected };

    }, [taxedJobs]);


    const setDatePreset = (preset: 'today' | 'month' | 'quarter' | 'year') => {
        const today = new Date();
        let fromDate: Date;
        switch(preset) {
            case 'today': fromDate = today; break;
            case 'month': fromDate = startOfMonth(new Date()); break;
            case 'quarter': fromDate = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1); break;
            case 'year': fromDate = new Date(today.getFullYear(), 0, 1); break;
        }
        setDateRange({ from: fromDate, to: today });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg">
                <div className='flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2'>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? format(dateRange.from, "PPP") : <span>Start Date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateRange.from} onSelect={(date) => setDateRange(prev => ({...prev, from: date}))} initialFocus /></PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.to ? format(dateRange.to, "PPP") : <span>End Date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateRange.to} onSelect={(date) => setDateRange(prev => ({...prev, to: date}))} initialFocus /></PopoverContent>
                    </Popover>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={() => setDatePreset('today')}>Today</Button>
                <Button variant="ghost" size="sm" onClick={() => setDatePreset('month')}>This Month</Button>
                <Button variant="ghost" size="sm" onClick={() => setDatePreset('quarter')}>This Quarter</Button>
                <Button variant="ghost" size="sm" onClick={() => setDatePreset('year')}>This Year</Button>
            </div>
    
            {loading ? (
                <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2">
                        <StatCard title="Total Net Sales (Taxable)" value={taxReportStats.totalNetSales} prefix="$" />
                        <StatCard title="Total Sales Tax Collected" value={taxReportStats.totalTaxCollected} prefix="$" />
                    </div>
                    <h3 className="text-lg font-semibold">Taxed Transactions ({taxedJobs.length})</h3>
                    {isMobile ? (
                      <div className="space-y-4">
                        {taxedJobs.map(job => {
                          const subtotal = (job.jobItems || []).reduce((sum, item) => sum + (item.quantity * item.price), 0);
                          const discount = (job.jobItems || []).reduce((sum, item) => {
                            const itemTotal = item.quantity * item.price;
                            if (item.discountType === '%') return sum + (itemTotal * (item.discountValue || 0) / 100);
                            return sum + ((item.discountValue || 0) * item.quantity);
                          }, 0);
                          const taxableAmount = subtotal - discount;
                          const tax = job.applySalesTax && job.totalAmount > 0 && taxableAmount > 0 ? (job.totalAmount - taxableAmount) : 0;
                          return (
                            <Card key={job.id} onClick={() => navigateTo('jobDetail', job)}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <p className="font-semibold">{job.customerName}</p>
                                  <div className="text-right">
                                    <p className="font-bold">Tax: ${(tax > 0 ? tax : 0).toFixed(2)}</p>
                                    <p className="text-sm">Sale: ${taxableAmount.toFixed(2)}</p>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">ID: {job.jobId}</p>
                                <p className="text-xs text-muted-foreground">Date: {formatDateTime(job.createdAt)}</p>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="border rounded-md">
                          <Table>
                              <TableHeader><TableRow><TableHead>Job ID</TableHead><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Net Sale</TableHead><TableHead className="text-right">Tax Collected</TableHead></TableRow></TableHeader>
                              <TableBody>
                                  {taxedJobs.length > 0 ? (
                                      taxedJobs.map(job => {
                                          const subtotal = (job.jobItems || []).reduce((sum, item) => sum + (item.quantity * item.price), 0);
                                          const discount = (job.jobItems || []).reduce((sum, item) => {
                                              const itemTotal = item.quantity * item.price;
                                              if (item.discountType === '%') return sum + (itemTotal * (item.discountValue || 0) / 100);
                                              return sum + ((item.discountValue || 0) * item.quantity);
                                          }, 0);
                                          const taxableAmount = subtotal - discount;
                                          const tax = job.applySalesTax && job.totalAmount > 0 && taxableAmount > 0 ? (job.totalAmount - taxableAmount) : 0;
                                          return (
                                          <TableRow key={job.id} onClick={() => navigateTo('jobDetail', job)} className="cursor-pointer">
                                              <TableCell className="font-medium">{job.jobId}</TableCell>
                                              <TableCell>{formatDateTime(job.createdAt)}</TableCell>
                                              <TableCell>{job.customerName}</TableCell>
                                              <TableCell className="text-right">${(taxableAmount).toFixed(2)}</TableCell>
                                              <TableCell className="text-right">${(tax > 0 ? tax : 0).toFixed(2)}</TableCell>
                                          </TableRow>
                                      )})
                                  ) : (
                                      <TableRow><TableCell colSpan={5} className="h-24 text-center">No transactions found for the selected filters.</TableCell></TableRow>
                                  )}
                              </TableBody>
                          </Table>
                      </div>
                    )}
                </>
            )}
        </div>
    );
}

const DepositReportTab = () => {
    const { showAppModal, navigateTo } = useAppContext();
    const isMobile = useIsMobile();
    const [allJobs, setAllJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
      from: new Date(),
      to: new Date(),
    });

    const paidJobs = useMemo(() => {
        return allJobs
          .filter(job => {
            if (!job.paymentDate || !['partially-paid', 'paid'].includes(job.status)) {
                return false;
            }
            if (dateRange.from && dateRange.to) {
                const startDate = new Date(dateRange.from);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(dateRange.to);
                endDate.setHours(23, 59, 59, 999);
                const paymentDate = new Date(job.paymentDate);
                if (paymentDate < startDate || paymentDate > endDate) return false;
            }
            return true;
          })
          .sort((a,b) => (b.paymentDate as any) - (a.paymentDate as any));
    }, [allJobs, dateRange]);
    
    const depositStats = useMemo(() => {
        const totals = {
            cash: 0,
            check: 0,
            credit: 0,
            deposit: 0,
        };

        paidJobs.forEach(job => {
            const paymentAmount = job.amountPaid || 0;
            switch(job.paymentType) {
                case 'Cash':
                    totals.cash += paymentAmount;
                    break;
                case 'Check':
                    totals.check += paymentAmount;
                    break;
                case 'Credit Card':
                case 'Other':
                    totals.credit += paymentAmount;
                    break;
            }
        });
        
        totals.deposit = totals.cash + totals.check;

        return totals;

    }, [paidJobs]);

    const setDatePreset = (preset: 'today' | 'month' | 'quarter' | 'year') => {
        const today = new Date();
        let fromDate: Date;
        switch(preset) {
            case 'today': fromDate = today; break;
            case 'month': fromDate = startOfMonth(new Date()); break;
            case 'quarter': fromDate = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1); break;
            case 'year': fromDate = new Date(today.getFullYear(), 0, 1); break;
        }
        setDateRange({ from: fromDate, to: today });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg">
                <div className='flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2'>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? format(dateRange.from, "PPP") : <span>Start Date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateRange.from} onSelect={(date) => setDateRange(prev => ({...prev, from: date}))} initialFocus /></PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.to ? format(dateRange.to, "PPP") : <span>End Date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateRange.to} onSelect={(date) => setDateRange(prev => ({...prev, to: date}))} initialFocus /></PopoverContent>
                    </Popover>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={() => setDatePreset('today')}>Today</Button>
                <Button variant="ghost" size="sm" onClick={() => setDatePreset('month')}>This Month</Button>
            </div>
    
            {loading ? (
                <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-4">
                        <StatCard title="Total Cash" value={depositStats.cash} prefix="$" />
                        <StatCard title="Total Checks" value={depositStats.check} prefix="$" />
                        <StatCard title="Bank Deposit Total" value={depositStats.deposit} prefix="$" />
                        <StatCard title="CC / Other" value={depositStats.credit} prefix="$" />
                    </div>
                    <h3 className="text-lg font-semibold">Payments Included in Report ({paidJobs.length})</h3>
                    {isMobile ? (
                      <div className="space-y-4">
                        {paidJobs.map(job => (
                          <Card key={job.id} onClick={() => navigateTo('jobDetail', job)}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <p className="font-semibold">{job.customerName}</p>
                                <p className="font-bold">${(job.amountPaid || 0).toFixed(2)}</p>
                              </div>
                              <p className="text-sm text-muted-foreground">ID: {job.jobId}</p>
                              <p className="text-sm text-muted-foreground">Type: {job.paymentType}</p>
                              <p className="text-xs text-muted-foreground">Paid: {formatDateTime(job.paymentDate)}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="border rounded-md">
                          <Table>
                              <TableHeader><TableRow><TableHead>Job ID</TableHead><TableHead>Payment Date</TableHead><TableHead>Customer</TableHead><TableHead>Payment Type</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                              <TableBody>
                                  {paidJobs.length > 0 ? (
                                      paidJobs.map(job => (
                                          <TableRow key={job.id} onClick={() => navigateTo('jobDetail', job)} className="cursor-pointer">
                                              <TableCell className="font-medium">{job.jobId}</TableCell>
                                              <TableCell>{formatDateTime(job.paymentDate)}</TableCell>
                                              <TableCell>{job.customerName}</TableCell>
                                              <TableCell>{job.paymentType}</TableCell>
                                              <TableCell className="text-right">${(job.amountPaid || 0).toFixed(2)}</TableCell>
                                          </TableRow>
                                      ))
                                  ) : (
                                      <TableRow><TableCell colSpan={5} className="h-24 text-center">No payments found for the selected date range.</TableCell></TableRow>
                                  )}
                              </TableBody>
                          </Table>
                      </div>
                    )}
                </>
            )}
        </div>
    );
}

const OutstandingBalanceReportTab = () => {
    const { navigateTo } = useAppContext();
    const isMobile = useIsMobile();
    const [allJobs, setAllJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
  
    const jobsWithBalance = useMemo(() => {
      return allJobs
        .filter(job => {
          if (job.archivedAt || job.isQuote || job.status === 'paid' || job.status === 'new') return false;
          const balance = (job.totalAmount || 0) - (job.amountPaid || 0);
          return balance > 0;
        })
        .sort((a, b) => (a.createdAt as any) - (b.createdAt as any));
    }, [allJobs]);
  
    const totalOutstandingBalance = useMemo(() => {
      return jobsWithBalance.reduce((sum, job) => sum + ((job.totalAmount || 0) - (job.amountPaid || 0)), 0);
    }, [jobsWithBalance]);
  
    return (
      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-1">
              <StatCard title="Total Outstanding Balance" value={totalOutstandingBalance} prefix="$" />
            </div>
            <h3 className="text-lg font-semibold">Jobs with an Outstanding Balance ({jobsWithBalance.length})</h3>
            {isMobile ? (
              <div className="space-y-4">
                {jobsWithBalance.map(job => {
                  const balanceDue = (job.totalAmount || 0) - (job.amountPaid || 0);
                  return (
                    <Card key={job.id} onClick={() => navigateTo('jobDetail', job)}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <p className="font-semibold">{job.customerName}</p>
                          <p className="font-bold">${balanceDue.toFixed(2)}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">ID: {job.jobId}</p>
                        <p className="text-sm text-muted-foreground capitalize">Status: {job.status}</p>
                        <p className="text-xs text-muted-foreground">Total: ${(job.totalAmount || 0).toFixed(2)}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead className="text-right">Amount Paid</TableHead>
                      <TableHead className="text-right">Balance Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobsWithBalance.length > 0 ? (
                      jobsWithBalance.map(job => {
                          const balanceDue = (job.totalAmount || 0) - (job.amountPaid || 0);
                          return (
                              <TableRow key={job.id} onClick={() => navigateTo('jobDetail', job)} className="cursor-pointer">
                                  <TableCell className="font-medium">{job.jobId}</TableCell>
                                  <TableCell>{job.customerName}</TableCell>
                                  <TableCell className="capitalize">{job.status}</TableCell>
                                  <TableCell className="text-right">${(job.totalAmount || 0).toFixed(2)}</TableCell>
                                  <TableCell className="text-right">${(job.amountPaid || 0).toFixed(2)}</TableCell>
                                  <TableCell className="text-right font-bold">${balanceDue.toFixed(2)}</TableCell>
                              </TableRow>
                          )
                      })
                    ) : (
                      <TableRow><TableCell colSpan={6} className="h-24 text-center">No jobs with an outstanding balance.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    );
};
  

export default function Reports() {
  const { navigateTo } = useAppContext();
  const isMobile = useIsMobile();

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>Analyze sales, tax, and deposit data.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="sales" orientation={isMobile ? 'vertical' : 'horizontal'}>
                    <TabsList className={cn("grid w-full", isMobile ? "grid-cols-2" : "grid-cols-4")}>
                        <TabsTrigger value="sales">Sales</TabsTrigger>
                        <TabsTrigger value="tax">Sales Tax</TabsTrigger>
                        <TabsTrigger value="deposit">Deposits</TabsTrigger>
                        <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
                    </TabsList>
                    <TabsContent value="sales" className="mt-4 md:mt-0">
                       <SalesReportTab />
                    </TabsContent>
                    <TabsContent value="tax" className="mt-4 md:mt-0">
                       <SalesTaxReportTab />
                    </TabsContent>
                    <TabsContent value="deposit" className="mt-4 md:mt-0">
                       <DepositReportTab />
                    </TabsContent>
                    <TabsContent value="outstanding" className="mt-4 md:mt-0">
                       <OutstandingBalanceReportTab />
                    </TabsContent>
                </Tabs>
            </CardContent>
            <CardFooter>
                <Button variant="outline" onClick={() => navigateTo('dashboard')}>Back to Dashboard</Button>
            </CardFooter>
        </Card>
    </div>
  );
}

    