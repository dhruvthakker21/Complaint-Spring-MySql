package com.example.complaint_management.repo;

import com.example.complaint_management.model.Complaint;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

//import java.lang.ScopedValue;
import java.util.List;

public interface CompRepo extends JpaRepository<Complaint,Integer> {

    List<Complaint> findByUserId(Integer userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Complaint c WHERE c.status = :status")
    int deleteByStatus(@Param("status") String status);
}

