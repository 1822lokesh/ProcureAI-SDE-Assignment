import axios from 'axios';

// Ensure this matches your Backend URL exactly
const API_URL = 'http://127.0.0.1:8000'; 

const api = axios.create({
    baseURL: API_URL,
});

// --- RFP Functions ---
export const getRFPs = async () => {
    const response = await api.get('/rfps/');
    return response.data;
};

export const getRFP = async (id) => {
    const response = await api.get(`/rfps/${id}`);
    return response.data;
};

export const createRFP = async (prompt_text) => {
    // Generate a title based on the first few words
    const title = prompt_text.split(' ').slice(0, 4).join(' ') + "...";
    const response = await api.post('/rfps/', { 
        title: title, 
        prompt_text: prompt_text 
    });
    return response.data;
};

// --- Proposal Functions ---
export const getProposals = async (rfpId) => {
    const response = await api.get(`/rfps/${rfpId}/proposals/`);
    return response.data;
};

export const uploadProposal = async (rfpId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/rfps/${rfpId}/proposals/`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// --- Vendor & Email Functions (These were missing!) ---
export const getVendors = async () => {
    const response = await api.get('/vendors/');
    return response.data;
};

export const sendRFPEmails = async (rfpId, vendorEmails) => {
    const response = await api.post(`/rfps/${rfpId}/send/`, {
        vendor_emails: vendorEmails
    });
    return response.data;
};

export default api;