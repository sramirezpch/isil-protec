import { Request, Response } from 'express';
import { formatoRepository } from '../../infrastructure/postgres/repository/formatoRepository';


export const formatoController = {
  async listarFormatos(req: Request, res: Response) {
    try {
      res.status(200).json(await formatoRepository.listAllFormatos());
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener los formatos' });
    }
  }
};
