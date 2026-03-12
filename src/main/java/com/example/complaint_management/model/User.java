package com.example.complaint_management.model;


import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name="users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String name;
    private String email;

    @Column(name = "role")
    private String role = "USER";

    private String password;
}
