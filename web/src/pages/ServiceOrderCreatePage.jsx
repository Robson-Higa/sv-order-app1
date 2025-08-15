import ServiceOrderForm from '../components/service-orders/ServiceOrderForm';

const ServiceOrderCreatePage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow max-w-lg w-full">
        <h1 className="text-2xl font-bold mb-6">Criar Nova Ordem de Serviço</h1>
        <ServiceOrderForm onSuccess={() => (window.location.href = '/service-orders')} />
      </div>
    </div>
  );
};

export default ServiceOrderCreatePage;
