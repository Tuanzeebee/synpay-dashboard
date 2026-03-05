package com.companyx.synpay_dashboard.service;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.companyx.synpay_dashboard.dto.request.CreatePositionRequest;
import com.companyx.synpay_dashboard.dto.request.UpdatePositionRequest;
import com.companyx.synpay_dashboard.dto.response.PositionPageResponse;
import com.companyx.synpay_dashboard.dto.response.PositionResponse;
import com.companyx.synpay_dashboard.entity.hr.Position;
import com.companyx.synpay_dashboard.exceptions.ResourceNotFoundException;
import com.companyx.synpay_dashboard.repository.hr.PositionRepository;

@Service
public class PositionService {

    private static final Logger log = LoggerFactory.getLogger(PositionService.class);

    private final PositionRepository positionRepository;
    private final AuditLogService auditLogService;

    public PositionService(PositionRepository positionRepository,
                           AuditLogService auditLogService) {
        this.positionRepository = positionRepository;
        this.auditLogService = auditLogService;
    }

    // ========================== LIST ==========================

    @Transactional(transactionManager = "hrTransactionManager", readOnly = true)
    public PositionPageResponse listPositions(int page, int size) {
        size = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(page, size, Sort.by("positionId").ascending());

        Page<Position> result = positionRepository.findAll(pageable);

        List<PositionResponse> content = result.getContent().stream()
                .map(this::toResponse)
                .toList();

        return new PositionPageResponse(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages()
        );
    }

    // ========================== GET BY ID ==========================

    @Transactional(transactionManager = "hrTransactionManager", readOnly = true)
    public PositionResponse getPosition(Integer id) {
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Position", id));
        return toResponse(position);
    }

    // ========================== CREATE ==========================

    @Transactional(transactionManager = "hrTransactionManager")
    public PositionResponse createPosition(CreatePositionRequest request,
                                           Integer actorAccountId,
                                           String ip, String ua) {
        Position position = new Position();
        position.setPositionName(request.getPositionName());

        position = positionRepository.save(position);

        PositionResponse response = toResponse(position);

        auditLogService.log(actorAccountId, "POSITION_CREATE", "position",
                position.getPositionId().toString(), null,
                Map.of("positionName", position.getPositionName()),
                ip, ua);

        log.info("Position created: id={}, name={}", position.getPositionId(), position.getPositionName());
        return response;
    }

    // ========================== UPDATE ==========================

    @Transactional(transactionManager = "hrTransactionManager")
    public PositionResponse updatePosition(Integer id,
                                           UpdatePositionRequest request,
                                           Integer actorAccountId,
                                           String ip, String ua) {
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Position", id));

        Map<String, Object> oldValue = Map.of(
                "positionName", position.getPositionName());

        if (request.getPositionName() != null) {
            position.setPositionName(request.getPositionName());
        }

        position = positionRepository.save(position);

        PositionResponse response = toResponse(position);

        Map<String, Object> newValue = Map.of(
                "positionName", position.getPositionName());

        auditLogService.log(actorAccountId, "POSITION_UPDATE", "position",
                id.toString(), oldValue, newValue, ip, ua);

        log.info("Position updated: id={}", id);
        return response;
    }

    // ========================== DELETE ==========================

    @Transactional(transactionManager = "hrTransactionManager")
    public void deletePosition(Integer id, Integer actorAccountId,
                               String ip, String ua) {
        Position position = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Position", id));

        Map<String, Object> oldValue = Map.of(
                "positionName", position.getPositionName());

        positionRepository.delete(position);

        auditLogService.log(actorAccountId, "POSITION_DELETE", "position",
                id.toString(), oldValue, null, ip, ua);

        log.info("Position deleted: id={}, name={}", id, position.getPositionName());
    }

    // ========================== MAPPER ==========================

    private PositionResponse toResponse(Position entity) {
        PositionResponse dto = new PositionResponse();
        dto.setPositionId(entity.getPositionId());
        dto.setPositionName(entity.getPositionName());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
