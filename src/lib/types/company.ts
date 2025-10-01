export interface Company {
	id: string;
	razonSocial: string;
	ruc: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreateCompanyData {
	razonSocial: string;
	ruc: string;
}

export interface UpdateCompanyData {
	razonSocial?: string;
	ruc?: string;
}
