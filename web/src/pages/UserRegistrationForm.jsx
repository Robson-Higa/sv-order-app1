import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import InputMask from 'react-input-mask';

const userTypes = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'TECHNICIAN', label: 'Técnico' },
  { value: 'END_USER', label: 'Usuário Final' },
];

export default function UserRegistrationForm({ establishments, onSubmit }) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm();

  const userType = watch('userType');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>Nome</label>
        <input {...register('name', { required: 'Nome é obrigatório' })} className="input" />
        {errors.name && <p className="error">{errors.name.message}</p>}
      </div>

      <div>
        <label>Email</label>
        <input
          type="email"
          {...register('email', {
            required: 'Email é obrigatório',
            pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' },
          })}
          className="input"
        />
        {errors.email && <p className="error">{errors.email.message}</p>}
      </div>

      <div>
        <label>Senha</label>
        <input
          type="password"
          {...register('password', { required: 'Senha é obrigatória' })}
          className="input"
        />
        {errors.password && <p className="error">{errors.password.message}</p>}
      </div>

      <div>
        <label>Tipo de Usuário</label>
        <select {...register('userType', { required: 'Tipo é obrigatório' })} className="input">
          <option value="">Selecione...</option>
          {userTypes.map((ut) => (
            <option key={ut.value} value={ut.value}>
              {ut.label}
            </option>
          ))}
        </select>
        {errors.userType && <p className="error">{errors.userType.message}</p>}
      </div>

      <div>
        <label>Telefone</label>
        <Controller
          control={control}
          name="phone"
          rules={{ required: 'Telefone é obrigatório' }}
          render={({ field }) => (
            <InputMask
              {...field}
              mask="(99) 99999-9999"
              placeholder="(00) 00000-0000"
              className="input"
            />
          )}
        />
        {errors.phone && <p className="error">{errors.phone.message}</p>}
      </div>

      {userType === 'END_USER' && (
        <div>
          <label>Estabelecimento</label>
          <select
            {...register('establishmentName', { required: 'Estabelecimento é obrigatório' })}
            className="input"
          >
            <option value="">Selecione...</option>
            {establishments.map((est) => (
              <option key={est.id} value={est.name}>
                {est.name}
              </option>
            ))}
          </select>
          {errors.establishmentName && <p className="error">{errors.establishmentName.message}</p>}
        </div>
      )}

      <button type="submit" className="btn-primary">
        Cadastrar
      </button>
    </form>
  );
}
