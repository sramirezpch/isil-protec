import type { Request, Response } from 'express';
import type { ClientService } from '../../../application/services/client.service';
import { type DtoResponse, toResponseDto } from '../../../utils';
import type {
  CreateClientBody,
  DeleteClientParams,
  UpdateClientBody,
  UpdateClientParams,
} from './/utils';

export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  getAll = async (req: Request, res: Response): Promise<Response> => {
    try {
      const query = req.query.q as string | undefined;
      const clients = await this.clientService.getAllClients(query);

      return res.status(200).json(toResponseDto(true, { clients }));
    } catch (error) {
      console.error('Error getting clients:', error);
      return res
        .status(500)
        .json(toResponseDto(false, { message: 'Error al obtener los clientes' }));
    }
  };

  updateById = async (
    req: Request<UpdateClientParams, DtoResponse, UpdateClientBody>,
    res: Response,
  ): Promise<Response> => {
    try {
      const id = req.params.id;
      const { phone, name, lastName, aliasTiktok, active } = req.body;

      await this.clientService.updateClient({ id, phone, name, lastName, aliasTiktok, active });

      return res
        .status(200)
        .json(toResponseDto(true, { message: 'Cliente actualizado con éxito' }));
    } catch (error) {
      if (error instanceof Error && error.message === 'El teléfono ya está registrado') {
        return res
          .status(409)
          .json(toResponseDto(false, { message: error.message }));
      }
      console.error('Error updating client:', error);
      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrió un error al actualizar cliente',
        }),
      );
    }
  };

  create = async (
    req: Request<null, DtoResponse, CreateClientBody>,
    res: Response,
  ) => {
    try {
      const { phone, name, lastName, aliasTiktok, active } = req.body;

      if (!phone) {
        return res
          .status(400)
          .json(toResponseDto(false, { message: 'El teléfono es obligatorio' }));
      }

      await this.clientService.create({ phone, name, lastName, aliasTiktok, active });

      return res
        .status(200)
        .json(toResponseDto(true, { message: 'Cliente registrado con exito' }));
    } catch (error: any) {
      if (error.message === 'El teléfono ya está registrado') {
        return res
          .status(409)
          .json(toResponseDto(false, { message: error.message }));
      }
      console.error('Error creating client:', error);

      return res
        .status(500)
        .json(
          toResponseDto(false, { message: 'Ocurrió un error al crear cliente' }),
        );
    }
  };

  delete = async (
    req: Request<DeleteClientParams, DtoResponse, null>,
    res: Response,
  ) => {
    try {
      const { id } = req.params;

      await this.clientService.delete(id);

      return res
        .status(200)
        .json(toResponseDto(true, { message: 'Cliente eliminado con éxito' }));
    } catch (error) {
      console.error('Error deleting client:', error);

      return res.status(500).json(
        toResponseDto(false, {
          message: 'Ocurrió un error al eliminar cliente',
        }),
      );
    }
  };
}