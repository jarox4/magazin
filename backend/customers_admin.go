package main

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
)

// listCustomers godoc
// @Summary     [Admin]List all customers
// @Tags        admin
// @Security    BearerAuth
// @Produce     json
// @Success     200 {array} Row
// @Failure     400 {object} ErrorResponse
// @Router      /admin/customers [get]
func listCustomers(c *gin.Context) {
	rows, err := db.Query(context.Background(),
		`SELECT id, email, full_name, COALESCE(phone,''), COALESCE(address,''), role, created_at
		 FROM users ORDER BY created_at DESC`)
	if err != nil { c.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()}); return }
	defer rows.Close()
	var list []Row
	for rows.Next() {
		var r Row
		rows.Scan(&r.ID, &r.Email, &r.FullName, &r.Phone, &r.Address, &r.Role, &r.CreatedAt)
		list = append(list, r)
	}
	if list == nil { list = []Row{} }
	c.JSON(http.StatusOK, list)
}
type Row struct {
	ID        int    `json:"id"`
	Email     string `json:"email"`
	FullName  string `json:"full_name"`
	Phone     string `json:"phone"`
	Address   string `json:"address"`
	Role      string `json:"role"`
	CreatedAt string `json:"created_at"`
}
