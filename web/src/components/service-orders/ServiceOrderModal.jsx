{
  showModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded w-[500px]">
        <ServiceOrderForm
          onSuccess={() => setShowModal(false)}
          onCancel={() => setShowModal(false)}
        />
      </div>
    </div>
  );
}
