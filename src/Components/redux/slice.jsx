import { createSlice } from "@reduxjs/toolkit";
import { act } from "@testing-library/react";
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from "axios";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const initialState = {
  allProduct: [],
  copyallProducts: [],
  favProd: [],
  categorias:[],
  comercio:[],
  clave:"",
  comandas:[],
  comandasTrue:[],
  comandasFalse:[],
  usuarioComander:"",
};


export const dataSlice = createSlice({
  name: "allData",
  initialState,
  reducers: {
    allProducts: (state, action) => {
      return {
        ...state,
        allProduct: action.payload,
        copyallProducts: action.payload,
      };
    },
    allCategorias: (state, action) => {
      return {
        ...state,
        categorias: action.payload,
      };
    },
    fillComercio: (state, action) => {
      return {
        ...state,
        comercio: action.payload,
      };
    },
    favProducts: (state, action) => {
      return {
        ...state,
        favProd: [...state.favProd, action.payload],
      };
    },
    fillClave: (state, action) => {
      return {
        ...state,
        clave: action.payload,
      };
    },
    fillUsuario: (state, action) => {
      return {
        ...state,
        usuarioComander: action.payload,
      };
    },
    cancelBagProducts: (state, action) => {
      const indexProd = state.favProd.findIndex(
        (product) => product.attributes.name === action.payload
      );
      console.log(indexProd, "cancel bag product");
      if (indexProd !== -1) {
        return {
          ...state,
          favProd: [
            ...state.favProd.slice(0, indexProd),
            ...state.favProd.slice(indexProd + 1),
          ],
        };
      }
      return state;
    },
    SearchProducts: (state, action) => {
      return {
        ...state,
        copyallProducts: state.allProduct
          .filter((e) => e.name.includes(action.payload) === true)
          .slice(0, 10),
      };
    },
    fillComanda: (state, action) => {
      let newComandas = Array.isArray(action.payload) ? action.payload.flat() : [action.payload];
      
      // Obtener las comandas que ya existen en el estado
      const existingComandas = state.comandas;
    
      // Actualizar las comandas existentes con los nuevos valores
      const updatedComandas = existingComandas.map(existingComanda => {
        // Buscar la comanda correspondiente en los nuevos datos
        const updatedComanda = newComandas.find(newComanda => newComanda.id === existingComanda.id);
        // Si se encuentra una comanda actualizada, devolverla, de lo contrario, mantener la comanda existente
        return updatedComanda ? updatedComanda : existingComanda;
      });
    
      // Combinar las comandas existentes con las nuevas comandas que no estén en el estado
      const combinedComandas = [...updatedComandas, ...newComandas.filter(newComanda => !updatedComandas.find(comanda => comanda.id === newComanda.id))];
    
      // Ordenar las comandas: false primero, luego true
      combinedComandas.sort((a, b) => (a.attributes?.entregado === b.attributes?.entregado ? 0 : a.attributes?.entregado ? 1 : -1));
    
      // Filtrar comandas por Status
      const comandasTrue = combinedComandas.filter(comanda => comanda?.attributes?.entregado === true);
      const comandasFalse = combinedComandas.filter(comanda => comanda?.attributes?.entregado === false);
    
      return {
        ...state,
        comandas: combinedComandas,
        comandasTrue: comandasTrue,
        comandasFalse: comandasFalse,
      };
    },
    
  },
});

//   console.log(response.data.data.attributes.comercio.data.id, " esto es lo que trae el response de todos los arituclos");
//-------------------------------------------------------------------------------------------------------------------
//------------------------------------------ function Movies ------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------
const API_STRAPI_ARTICTULOS = process.env.REACT_APP_API_STRAPI_ARTICTULOS;
const API_CATEGORIAS = process.env.REACT_APP_API_STRAPI_CATEGORIAS;
const API_COMERCIO = process.env.REACT_APP_API_STRAPI_COMERCIOS;
const API_ORDER = process.env.REACT_APP_API_ORDER;
const jwtSecret = process.env.JWT_SECRET;
const API_US = process.env.REACT_APP_API_USERS;
const IDENTIFIERU = process.env.REACT_APP_IDENTIFIER;
const PASSWORDU = process.env.REACT_APP_PASSWORD;

export const asyncAllProducts = () => {
  return async function (dispatch) {
    try {
      let currentPage = 1;
      let allData = [];

      // Realizar solicitudes de paginación hasta que se recopile toda la información
      while (true) {
        const pagination = {}; // Declarar el objeto pagination
        pagination.page = currentPage; // Declarar la propiedad page en pagination

        const response = await axios.get(`${API_STRAPI_ARTICTULOS}`, {
          params: { pagination },
        });

        if (!response.data.data || response.data.data.length === 0) {
          // Si no hay más datos, salir del bucle
          break;
        }

        // Filtrar los datos para asegurarse de tener valores en sub_categoria.data y categorias.data
        const filteredData = response.data.data.filter(
          (item) =>
            item.attributes?.sub_categoria?.data &&
            item.attributes?.sub_categoria?.data?.id &&
            item.attributes?.categorias?.data &&
            item.attributes?.categorias?.data?.id
        );

        // Agregar los datos filtrados de la página actual al conjunto total
        allData = [...allData, ...filteredData];

        // Ir a la siguiente página
        currentPage++;

        // Actualizar la condición del bucle while
        if (response.data.data.length < 25) {
          // Si hay menos de 25 elementos en la respuesta, asumimos que es la última página
          break;
        }
      }

      // Despachar la acción con la información completa
    
      return dispatch(allProducts(allData));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
};
export const asyncComercio = () => {
  return async function (dispatch) {
    try {
      const response = await axios.get(API_COMERCIO);
      return dispatch(fillComercio(response.data.data));
    } catch (error) {
      console.error("Error fetching data comercio:", error);
    }
  };
};
export const asyncCategorias = () => {
  return async function (dispatch) {
    try {
      const response = await axios.get(API_CATEGORIAS);
      const categoriasOrdenadas = response.data.data.sort((a, b) => a.id - b.id);
      return dispatch(allCategorias(response.data.data));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
};

export const asyncfavProducts = (pedido) => {
  return async function (dispatch) {
    try {
      toast.success("Product removed from Agregado successfully!");
      return dispatch(favProducts(pedido));
    } catch (error) {
      console.error("Error removing product from favorites:", error);
      // Show error notification
      toast.error("Error removing product from favorites. Please try again.");
    }
  };
};
export const asyncCancelFav = (pedido) => {
  return async function (dispatch) {
    try {
      dispatch(cancelBagProducts(pedido.attributes.name));

      // Show success notification
      toast.success("Product removed from favorites successfully!");
    } catch (error) {
      console.error("Error removing product from favorites:", error);
      // Show error notification
      toast.error("Error removing product from favorites. Please try again.");
    }
  };
};

export const asyncSearchBar = (string) => {
  return async function (dispatch) {
    return dispatch(SearchProducts(string));
  };
};



export const asyncOrder = ({ metodo_de_pago, pedido,tipo_pedido, name, detalle, total_pedido, telefono, domicilio }) => {
  return async function (dispatch, getState) {
    try {
      // Use getState to retrieve the current state
      const initialState = getState();
      
      // Access the clave from the state
      const clave = initialState?.alldata?.clave;
      const CreatedBy = IDENTIFIERU;
      
      // Remove the unnecessary nesting of the 'data' property
      const data = {data:{ metodo_de_pago, pedido, name,tipo_pedido, detalle, total_pedido, telefono, domicilio }};

      // Perform the API request with the Authorization header
      await axios.post(API_ORDER, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clave}`, // Use clave from the state
        },
      });

      console.log("posteado correctamente, sliceee");
      return dispatch();
    } catch (error) {
      console.log(error, "from Order");
    }
  };
};



export const asyncUser = () => {
  return async function (dispatch) {
    try {
      const data = {
        identifier:IDENTIFIERU,
        password:PASSWORDU
      };

      const response = await axios.post(API_US, data);
      const categoriasOrdenadas = response.data.jwt;

      return dispatch(fillClave(categoriasOrdenadas));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
};


export const asyncLogIn = ({email,password}) => {
  return async function (dispatch) {
    try {
      const data = {
        identifier:email,
        password:password
      };

      const response = await axios.post(API_US, data);
      const ComanderJWT = response.data.jwt;

      return  dispatch(fillUsuario(ComanderJWT));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
};





export const asyncComandas = () => {
  return async function (dispatch, getState) {
    try {
      const initialState = getState();
    
      const usuarioComander = initialState?.alldata?.usuarioComander;
 

      const response = await axios.get(API_ORDER, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${usuarioComander}`,
        },
      });

      console.log(response.data.data, "antes de enviarlo asyncComandas");

      return dispatch(fillComanda(response?.data?.data));
    } catch (error) {
      console.error('Error al obtener comandas:', error);
      // Puedes dispatchar una acción para manejar el error según tus necesidades
    }
  };
};


 

export const asyncPedidoRealizado = (comanda) => {
  return async function (dispatch, getState) {
    try {
      const initialState = getState();
      const usuarioComander = initialState?.alldata?.usuarioComander;

      // Modifica solo el estado de la propiedad 'Status' a true o false
      const updatedComanda = {
        ...comanda.attributes,
        entregado: !comanda.attributes.entregado,
      };

      const response = await axios.put(`${API_ORDER}/${comanda.id}`, { data: updatedComanda }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${usuarioComander}`,
        },
      });

      // Después de realizar la edición, vuelve a obtener las comandas actualizadas
      await dispatch(asyncComandas());

      // Actualiza los estados comandasTrue y comandasFalse
      const updatedComandasTrue = getState().alldata.comandas.filter(comanda => comanda.attributes.entregado === true);
      const updatedComandasFalse = getState().alldata.comandas.filter(comanda => comanda.attributes.entregado === false);

      toast.success("Pedido realizado successfully!");
      return dispatch(fillComanda(response?.data?.data, updatedComandasTrue, updatedComandasFalse));
    } catch (error) {
      console.error('Error during pedido realizado:', error);
      // Show error notification
      toast.error("Error during pedido realizado. Please try again.");
    }
  };
};

//----------------------------------------------------------------------------------------------------------------

export const { allProducts, favProducts, cancelBagProducts, SearchProducts, allCategorias, fillComercio, fillClave, fillComanda,fillUsuario } =
  dataSlice.actions;

export default dataSlice.reducer;
