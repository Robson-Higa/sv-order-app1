import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { ServiceOrder, User, Establishment } from '../types';

interface ReportData {
  serviceOrders: ServiceOrder[];
  establishments: Establishment[];
  technicians: User[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  filters: {
    establishmentId?: string;
    technicianId?: string;
    status?: string;
  };
}

interface ReportStats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageCompletionTime: number;
  averageRating: number;
  ordersByStatus: Record<string, number>;
  ordersByPriority: Record<string, number>;
  ordersByEstablishment: Record<string, number>;
  ordersByTechnician: Record<string, number>;
}

class ReportService {
  private calculateStats(orders: ServiceOrder[]): ReportStats {
    const stats: ReportStats = {
      totalOrders: orders.length,
      completedOrders: 0,
      cancelledOrders: 0,
      averageCompletionTime: 0,
      averageRating: 0,
      ordersByStatus: {},
      ordersByPriority: {},
      ordersByEstablishment: {},
      ordersByTechnician: {},
    };

    let totalRating = 0;
    let ratedOrders = 0;
    let totalCompletionTime = 0;
    let completedOrdersWithTime = 0;

    orders.forEach(order => {
      // Status
      stats.ordersByStatus[order.status] = (stats.ordersByStatus[order.status] || 0) + 1;
      
      // Priority
      stats.ordersByPriority[order.priority] = (stats.ordersByPriority[order.priority] || 0) + 1;
      
      // Establishment
      const establishmentName = order.establishment?.name || 'Não informado';
      stats.ordersByEstablishment[establishmentName] = (stats.ordersByEstablishment[establishmentName] || 0) + 1;
      
      // Technician
      if (order.technician) {
        stats.ordersByTechnician[order.technician.name] = (stats.ordersByTechnician[order.technician.name] || 0) + 1;
      }

      // Completed and cancelled
      if (order.status === 'completed' || order.status === 'confirmed') {
        stats.completedOrders++;
        
        if (order.completedAt) {
          const createdAt = new Date(order.createdAt);
          const completedAt = new Date(order.completedAt);
          const completionTime = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24); // dias
          totalCompletionTime += completionTime;
          completedOrdersWithTime++;
        }
      }
      
      if (order.status === 'cancelled') {
        stats.cancelledOrders++;
      }

      // Rating
      if (order.userRating) {
        totalRating += order.userRating;
        ratedOrders++;
      }
    });

    stats.averageRating = ratedOrders > 0 ? totalRating / ratedOrders : 0;
    stats.averageCompletionTime = completedOrdersWithTime > 0 ? totalCompletionTime / completedOrdersWithTime : 0;

    return stats;
  }

  private generateHTMLReport(data: ReportData, stats: ReportStats): string {
    const { serviceOrders, dateRange, filters } = data;
    
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const getStatusText = (status: string) => {
      const statusMap: Record<string, string> = {
        'open': 'Aberta',
        'assigned': 'Atribuída',
        'in_progress': 'Em Progresso',
        'completed': 'Concluída',
        'confirmed': 'Confirmada',
        'cancelled': 'Cancelada',
      };
      return statusMap[status] || status;
    };

    const getPriorityText = (priority: string) => {
      const priorityMap: Record<string, string> = {
        'low': 'Baixa',
        'medium': 'Média',
        'high': 'Alta',
        'urgent': 'Urgente',
      };
      return priorityMap[priority] || priority;
    };

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Ordens de Serviço</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #007bff;
            margin: 0;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #007bff;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #007bff;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
        }
        .stat-label {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #007bff;
            color: white;
        }
        tr:nth-child(even) {
            background-color: #f2f2f2;
        }
        .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            color: white;
        }
        .status-open { background-color: #ffc107; }
        .status-assigned { background-color: #17a2b8; }
        .status-in_progress { background-color: #007bff; }
        .status-completed { background-color: #28a745; }
        .status-confirmed { background-color: #6f42c1; }
        .status-cancelled { background-color: #dc3545; }
        .priority-low { color: #28a745; }
        .priority-medium { color: #ffc107; }
        .priority-high { color: #fd7e14; }
        .priority-urgent { color: #dc3545; }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Relatório de Ordens de Serviço</h1>
        <p>Período: ${formatDate(dateRange.startDate)} a ${formatDate(dateRange.endDate)}</p>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        ${filters.establishmentId ? `<p>Estabelecimento: ${data.establishments.find(e => e.id === filters.establishmentId)?.name || 'N/A'}</p>` : ''}
        ${filters.technicianId ? `<p>Técnico: ${data.technicians.find(t => t.id === filters.technicianId)?.name || 'N/A'}</p>` : ''}
        ${filters.status ? `<p>Status: ${getStatusText(filters.status)}</p>` : ''}
    </div>

    <div class="section">
        <h2>Resumo Geral</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${stats.totalOrders}</div>
                <div class="stat-label">Total de Ordens</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.completedOrders}</div>
                <div class="stat-label">Ordens Concluídas</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.cancelledOrders}</div>
                <div class="stat-label">Ordens Canceladas</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.averageRating.toFixed(1)}</div>
                <div class="stat-label">Avaliação Média</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.averageCompletionTime.toFixed(1)}</div>
                <div class="stat-label">Tempo Médio (dias)</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${((stats.completedOrders / stats.totalOrders) * 100).toFixed(1)}%</div>
                <div class="stat-label">Taxa de Conclusão</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Distribuição por Status</h2>
        <table>
            <thead>
                <tr>
                    <th>Status</th>
                    <th>Quantidade</th>
                    <th>Percentual</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(stats.ordersByStatus).map(([status, count]) => `
                    <tr>
                        <td><span class="status-badge status-${status}">${getStatusText(status)}</span></td>
                        <td>${count}</td>
                        <td>${((count / stats.totalOrders) * 100).toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Distribuição por Prioridade</h2>
        <table>
            <thead>
                <tr>
                    <th>Prioridade</th>
                    <th>Quantidade</th>
                    <th>Percentual</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(stats.ordersByPriority).map(([priority, count]) => `
                    <tr>
                        <td><span class="priority-${priority}">${getPriorityText(priority)}</span></td>
                        <td>${count}</td>
                        <td>${((count / stats.totalOrders) * 100).toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Distribuição por Estabelecimento</h2>
        <table>
            <thead>
                <tr>
                    <th>Estabelecimento</th>
                    <th>Quantidade</th>
                    <th>Percentual</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(stats.ordersByEstablishment).map(([establishment, count]) => `
                    <tr>
                        <td>${establishment}</td>
                        <td>${count}</td>
                        <td>${((count / stats.totalOrders) * 100).toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    ${Object.keys(stats.ordersByTechnician).length > 0 ? `
    <div class="section">
        <h2>Distribuição por Técnico</h2>
        <table>
            <thead>
                <tr>
                    <th>Técnico</th>
                    <th>Quantidade</th>
                    <th>Percentual</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(stats.ordersByTechnician).map(([technician, count]) => `
                    <tr>
                        <td>${technician}</td>
                        <td>${count}</td>
                        <td>${((count / stats.totalOrders) * 100).toFixed(1)}%</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    <div class="section">
        <h2>Detalhes das Ordens</h2>
        <table>
            <thead>
                <tr>
                    <th>Número</th>
                    <th>Título</th>
                    <th>Status</th>
                    <th>Prioridade</th>
                    <th>Estabelecimento</th>
                    <th>Técnico</th>
                    <th>Data Criação</th>
                    <th>Avaliação</th>
                </tr>
            </thead>
            <tbody>
                ${serviceOrders.map(order => `
                    <tr>
                        <td>${order.orderNumber || '-'}</td>
                        <td>${order.title}</td>
                        <td><span class="status-badge status-${order.status}">${getStatusText(order.status)}</span></td>
                        <td><span class="priority-${order.priority}">${getPriorityText(order.priority)}</span></td>
                        <td>${order.establishment?.name || 'N/A'}</td>
                        <td>${order.technician?.name || 'N/A'}</td>
                        <td>${formatDate(order.createdAt)}</td>
                        <td>${order.userRating ? `${order.userRating}/5` : 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Sistema de Gestão de Ordens de Serviço</p>
        <p>Relatório gerado automaticamente</p>
    </div>
</body>
</html>
    `;
  }

  async generateReport(data: ReportData): Promise<string> {
    try {
      const stats = this.calculateStats(data.serviceOrders);
      const htmlContent = this.generateHTMLReport(data, stats);
      
      const fileName = `relatorio_ordens_${new Date().toISOString().split('T')[0]}.html`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      await RNFS.writeFile(filePath, htmlContent, 'utf8');
      
      return filePath;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw new Error('Não foi possível gerar o relatório');
    }
  }

  async shareReport(filePath: string): Promise<void> {
    try {
      const shareOptions = {
        title: 'Relatório de Ordens de Serviço',
        message: 'Relatório gerado pelo Sistema de Gestão de Ordens de Serviço',
        url: `file://${filePath}`,
        type: 'text/html',
      };

      await Share.open(shareOptions);
    } catch (error) {
      console.error('Erro ao compartilhar relatório:', error);
      throw new Error('Não foi possível compartilhar o relatório');
    }
  }

  async generateAndShareReport(data: ReportData): Promise<void> {
    try {
      const filePath = await this.generateReport(data);
      await this.shareReport(filePath);
    } catch (error) {
      console.error('Erro ao gerar e compartilhar relatório:', error);
      throw error;
    }
  }
}

export const reportService = new ReportService();
export default reportService;

